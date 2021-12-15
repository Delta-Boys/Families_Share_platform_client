import React from "react";
import axios from "axios";
import moment from "moment";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import MyFamiliesShareHeader from "./MyFamiliesShareHeader";
import withLanguage from "./LanguageContext";
import GroupList from "./GroupList";
import TimeslotsList from "./TimeslotsList";
import Texts from "../Constants/Texts";
import Log from "./Log";
import Images from "../Constants/Images";
import TimeslotPreview from "./TimeslotPreview";

const getMyGroups = userId => {
  return axios
    .get(`/api/users/${userId}/groups`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return [];
    });
};

const getMyTimeslots = userId => {
  return axios
    .get(`/api/users/${userId}/events`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return [];
    });
};
const getMyUnreadNotifications = userId => {
  return axios
    .get(`/api/users/${userId}/notifications/unread`)
    .then(response => {
      return response.data.unreadNotifications;
    })
    .catch(error => {
      Log.error(error);
      return 0;
    });
};

const updateDeviceToken = (userId, deviceToken) => {
  return axios
    .post(`/api/users/${userId}/deviceToken`, {
      deviceToken
    })
    .then()
    .catch(error => {
      Log.error(error);
    });
};

const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

class MyFamiliesShareScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      fetchedUserInfo: false,
      myTimeslots: [],
      myGroups: [],
      pendingInvites: 0,
      timeslotsInvitedTo: [],
    };
  }

  async componentDidMount() {
    const deviceToken = localStorage.getItem("deviceToken");
    const userId = JSON.parse(localStorage.getItem("user")).id;
    if (deviceToken !== undefined && deviceToken !== "undefined") {
      await updateDeviceToken(userId, deviceToken);
    }
    const groups = await getMyGroups(userId);
    const myGroups = groups
      .filter(group => group.user_accepted && group.group_accepted)
      .map(group => group.group_id);
    const pendingInvites = groups.filter(
      group => group.group_accepted && !group.user_accepted
    ).length;
    const unreadNotifications = await getMyUnreadNotifications(userId);
    let myTimeslots = await getMyTimeslots(userId);
    myTimeslots = myTimeslots.filter(
      t => new Date(t.start.dateTime).getTime() - new Date().getTime() > 0
    );
    let dates = myTimeslots.map(timeslot => timeslot.start.dateTime);
    dates = dates.sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    const uniqueDates = [];
    const temp = [];
    dates.forEach(date => {
      const t = moment(date).format("DD-MM-YYYY");
      if (!temp.includes(t)) {
        temp.push(t);
        uniqueDates.push(date);
      }
    });

    const timeslotInvites = await axios
      .get(`/api/users/invites`, { params: { status: "pending" } })
      .then(response => response.data);
    const timeslotInvitesMap = groupBy(timeslotInvites, 'timeslot_id');
    const timeslotIdsInvitedTo = [...new Set(timeslotInvites.map(t => t.timeslot_id))];
    const timeslotsInvitedTo = await Promise.all(
      timeslotIdsInvitedTo.map(timeslot_id => {
        const { group_id, activity_id } = timeslotInvitesMap[timeslot_id][0];
        return axios
          .get(`/api/groups/${group_id}/activities/${activity_id}/timeslots/${timeslot_id}`)
          .then(response => response.data);
      })
    )
    const names = await Promise.all(timeslotInvites.map(invite =>
      invite.invitee_id === userId
        ? Promise.resolve('you')
        : axios
          .get("/api/children", { params: { ids: [invite.invitee_id] } })
          .then(response => response.data[0].given_name)
    ));
    names.forEach((name, i) => {
      timeslotInvites[i].invitee_name = name
    })
    timeslotsInvitedTo.forEach(timeslot => {
      const invites = timeslotInvitesMap[timeslot.id];
      timeslot.invites = invites;
      timeslot.invitedNames = invites.map(invite => invite.invitee_name);
    });

    this.setState({
      fetchedUserInfo: true,
      unreadNotifications,
      dates: uniqueDates,
      myGroups,
      myTimeslots,
      pendingInvites,
      timeslotsInvitedTo,
    });
  }

  renderGroupSection = () => {
    const { language } = this.props;
    const { myGroups } = this.state;
    const texts = Texts[language].myFamiliesShareScreen;
    return (
      <div className="myGroupsContainer">
        <div className="myGroupsContainerHeader">{texts.myGroups}</div>
        {myGroups.length > 0 ? (
          <GroupList groupIds={myGroups} />
        ) : (
          <div className="myGroupsContainerPrompt">{texts.myGroupsPrompt}</div>
        )}
      </div>
    );
  };

  handleInviteAccept = async timeslotIndex => {
    const { timeslotsInvitedTo } = this.state;
    const timeslot = timeslotsInvitedTo[timeslotIndex];
    await axios.post(`/api/users/invites/${timeslot.id}/accept`);
    window.location.reload(false);
  }

  handleInviteDecline = async timeslotIndex => {
    const { timeslotsInvitedTo } = this.state;
    const timeslot = timeslotsInvitedTo[timeslotIndex];
    await axios.post(`/api/users/invites/${timeslot.id}/decline`);
    this.setState({ timeslotIdsInvitedTo: timeslotsInvitedTo.splice(timeslotIndex, 1) });
  }

  renderTimeslotInvitesSection = () => {
    const { language } = this.props;
    const { timeslotsInvitedTo } = this.state;
    const texts = Texts[language].myFamiliesShareScreen;
    return timeslotsInvitedTo.length > 0 && (
      <div className="myGroupsContainer">
        <div className="myGroupsContainerHeader">{texts.myTimeslotInvites}</div>
        <ul>
          {timeslotsInvitedTo.map((timeslot, timeslotIndex) => {
            return (
              <li key={timeslotIndex} style={{ margin: "1rem 0" }}>
                <div> <span style={{ textTransform: 'capitalize' }}>{timeslot.invitedNames.join(', ')}</span>{texts.invitedTo}</div>
                <div className="row no-gutters">
                  <div className="col-6-10">
                    <TimeslotPreview timeslot={timeslot} />
                  </div>
                  <div className="col-2-10">
                    <button
                      type="button"
                      className="transparentButton center"
                      onClick={() => this.handleInviteAccept(timeslotIndex)}
                    >
                      <i className="fas fa-check" />
                    </button>
                  </div>
                  <div className="col-2-10">
                    <button
                      type="button"
                      className="transparentButton center"
                      onClick={() => this.handleInviteDecline(timeslotIndex)}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>);
  }

  renderTimeslotsSection = () => {
    const { language } = this.props;
    const { myTimeslots, dates } = this.state;
    const texts = Texts[language].myFamiliesShareScreen;
    return (
      <div className="myGroupsContainer">
        <div className="myGroupsContainerHeader">{texts.myActivities}</div>
        {myTimeslots.length > 0 ? (
          <TimeslotsList timeslots={myTimeslots} dates={dates} />
        ) : (
          <div className="myGroupsContainerPrompt">
            {texts.myActivitiesPrompt}
          </div>
        )}
      </div>
    );
  };

  renderPromptAction = () => {
    const {
      language,
      history: { push: pushHistory }
    } = this.props;
    const texts = Texts[language].myFamiliesShareScreen;
    const { myGroups } = this.state;
    if (myGroups.length === 0) {
      return (
        <div className="myPromptSection">
          <div className="myPromptActionsContainer">
            <button
              type="button"
              className="myPromptAction"
              onClick={() => pushHistory("/groups/search")}
            >
              {texts.joinPrompt}
            </button>
            <button
              type="button"
              className="myPromptAction"
              onClick={() => pushHistory("/groups/create")}
            >
              {texts.createPrompt}
            </button>
          </div>
          <img
            className="myPromptImage"
            src={Images.promptImage}
            alt="confetti icon"
          />
        </div>
      );
    }
    return null;
  };

  render() {
    const { pendingInvites, unreadNotifications, fetchedUserInfo } = this.state;
    return (
      <React.Fragment>
        <div id="drawerContainer">
          <MyFamiliesShareHeader
            pendingInvites={pendingInvites}
            pendingNotifications={unreadNotifications}
          />
          {fetchedUserInfo && (
            <div id="myFamiliesShareMainContainer">
              {this.renderGroupSection()}
              {this.renderTimeslotInvitesSection()}
              {this.renderTimeslotsSection()}
              {this.renderPromptAction()}
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
}

MyFamiliesShareScreen.propTypes = {
  language: PropTypes.string,
  history: PropTypes.object
};

export default withLanguage(withRouter(MyFamiliesShareScreen));
