import React from "react";
import axios from "axios";
import moment from "moment";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import * as path from "lodash.get";
import { withSnackbar } from "notistack";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import ConfirmDialog from "./ConfirmDialog";
import OptionsModal from "./OptionsModal";
import LoadingSpinner from "./LoadingSpinner";
import Images from "../Constants/Images";
import Log from "./Log";
import Avatar from "./Avatar";

const styles = {
  add: {
    position: "fixed",
    bottom: "3rem",
    right: "5%",
    height: "5rem",
    width: "5rem",
    borderRadius: "50%",
    border: "solid 0.5px #999",
    backgroundColor: "#ff6f00",
    zIndex: 100,
    fontSize: "2rem"
  },
  avatar: {
    width: "3rem!important",
    height: "3rem!important"
  }
};

const getActivityRequest = (activityRequestId, groupId) => {
  return axios
    .get(`/api/groups/${groupId}/activityrequests/${activityRequestId}`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return {};
    });
};

const getChildren = ids => {
  return axios
    .get("/api/children", {
      params: {
        ids,
        searchBy: "ids"
      }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return [];
    });
};

const getGroupMembers = groupId => {
  return axios
    .get(`/api/groups/${groupId}/members`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return [];
    });
};

class ActivityRequestScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fetchedData: false,
      pendingRequest: false,
      activityRequest: {},
      children: [],
      optionsModalIsOpen: false,
      confirmDialogIsOpen: false,
      action: "",
      userCanEdit: false,
      userIsCreator: false
    };
  }

  async componentDidMount() {
    const { match: { params: { groupId, activityRequestId } } } = this.props;
    const userId = JSON.parse(localStorage.getItem("user")).id;

    const activityRequest = await getActivityRequest(activityRequestId, groupId);

    const children = await getChildren(activityRequest.children).then(c => c.sort((a, b) =>
      `${a.given_name} ${a.family_name}` - `${b.given_name} ${b.family_name}`
    ));

    const groupMembers = await getGroupMembers(groupId);
    const userIsAdmin = groupMembers.filter(
      member =>
        member.user_id === userId &&
        member.group_accepted &&
        member.user_accepted
    )[0].admin;
    const userIsCreator = userId === activityRequest.creator_id;
    const userCanEdit = userIsAdmin || userIsCreator;

    this.setState({ activityRequest, children, fetchedData: true, userCanEdit, userIsCreator });
  }

  handleRedirect = (suspended, child_id) => {
    const { history } = this.props;
    if (!suspended) {
      history.push(`/profiles/groupmember/children/${child_id}`);
    }
  };

  renderList(list) {
    const { classes } = this.props;
    return list.map((profile, index) => (
      <li key={index} style={{ display: "block" }}>
        <div className="row" style={{ margin: "1rem 0" }}>
          <Avatar
            route={`/profiles/groupmember/children/${profile.child_id}`}
            className={classes.avatar}
            thumbnail={path(profile, ["image", "path"])}
            disabled={profile.suspended}
          />
          <div
            role="button"
            tabIndex={-42}
            className="participantsText"
            onClick={() =>
              this.handleRedirect(profile.suspended, profile.child_id)
            }
          >
            {`${profile.given_name} ${profile.family_name}`}
          </div>
        </div>
      </li>
    ));
  };

  renderChildren() {
    const {
      children
    } = this.state;
    const { language } = this.props;
    const texts = Texts[language].activityRequestScreen;
    const rowStyle = { minHeight: "5rem" };
    return (
      <React.Fragment>
        <div className="row no-gutters" style={rowStyle}>
          <div className="col-1-10">
            <img
              src={Images.babyFace}
              alt="map marker icon"
              className="activityInfoImage"
            />
          </div>
          <div className="col-8-10">
            <div className="activityInfoDescription">{texts.children}</div>
          </div>
        </div>
        <div
          className="row no-gutters"
          style={rowStyle}
        >
          <div className="col-1-10" />
          <div className="col-9-10">
            <div className="participantsContainer">
              <ul>{this.renderList(children)}</ul>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  handleEdit = () => {
    const { history } = this.props;
    const { pathname } = history.location;
    history.push(`${pathname}/edit`);
  };

  handleConfirmDialogOpen = action => {
    this.setState({
      confirmDialogIsOpen: true,
      optionsModalIsOpen: false,
      action
    });
  };

  handleConfirmDialogClose = choice => {
    const { action } = this.state;
    if (choice === "agree") {
      switch (action) {
        case "delete":
          this.handleDelete();
          break;
        default:
      }
    }
    this.setState({ confirmDialogIsOpen: false });
  };

  handleOptions = () => {
    const { optionsModalIsOpen } = this.state;
    this.setState({ optionsModalIsOpen: !optionsModalIsOpen });
  };

  handleOptionsClose = () => {
    this.setState({ optionsModalIsOpen: false });
  };

  handleDelete = () => {
    const { match: { params: { groupId, activityRequestId } }, history } = this.props;
    this.setState({ pendingRequest: true })
    axios
      .delete(`/api/groups/${groupId}/activityrequests/${activityRequestId}`)
      .then(response => {
        Log.info(response);
        history.goBack();
      })
      .catch(error => {
        Log.error(error);
        history.goBack();
      });
  };

  render() {
    const { history, language } = this.props;
    const {
      fetchedData,
      pendingRequest,
      activityRequest,
      optionsModalIsOpen,
      confirmDialogIsOpen,
      userCanEdit,
      userIsCreator
    } = this.state;
    const texts = Texts[language].activityRequestScreen;
    const options = [
      {
        label: texts.delete,
        style: "optionsModalButton",
        handle: () => {
          this.handleConfirmDialogOpen("delete");
        }
      }
    ];
    const confirmDialogTitle = texts.deleteDialogTitle;
    const rowStyle = { minHeight: "5rem" };
    return fetchedData ? (
      <React.Fragment>
        {pendingRequest && <LoadingSpinner />}
        <div id="activityContainer">
          <ConfirmDialog
            title={confirmDialogTitle}
            isOpen={confirmDialogIsOpen}
            handleClose={this.handleConfirmDialogClose}
          />
          <OptionsModal
            isOpen={optionsModalIsOpen}
            handleClose={this.handleOptionsClose}
            options={options}
          />
          <div id="activityHeaderContainer" className="row no-gutters">
            <div className="col-2-10">
              <button
                type="button"
                className="transparentButton center"
                onClick={() => history.goBack()}
              >
                <i className="fas fa-arrow-left" />
              </button>
            </div>
            <div className="col-6-10">
              <h1 className="center">{activityRequest.name}</h1>
            </div>
            <div className="col-1-10">
              {userCanEdit ? (
                <button
                  type="button"
                  className="transparentButton center"
                  onClick={this.handleEdit}
                >
                  <i className="fas fa-pencil-alt" />
                </button>
              ) : (
                <div />
              )}
            </div>
            <div className="col-1-10">
              {userCanEdit ? (
                <button
                  type="button"
                  className="transparentButton center"
                  onClick={this.handleOptions}
                >
                  <i className="fas fa-ellipsis-v" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
          <div id="activityRequestMainContainer">
            <div className="row no-gutters" style={rowStyle}>
              <div className="activityInfoHeader">{texts.infoHeader}</div>
            </div>
            {activityRequest.description && (
              <div className="row no-gutters" style={rowStyle}>
                <div className="col-1-10">
                  <i className="far fa-file-alt activityInfoIcon" />
                </div>
                <div className="col-9-10">
                  <div className="activityInfoDescription">
                    {activityRequest.description}
                  </div>
                </div>
              </div>
            )}
            <div className="row no-gutters" style={rowStyle}>
              <div className="col-1-10">
                <i className="far fa-calendar activityInfoIcon" />
              </div>
              <div className="col-9-10">
                <div className="activityInfoDescription">
                  {moment(activityRequest.date).format("DD MMMM YYYY")}
                </div>
              </div>
            </div>
            <div className="row no-gutters" style={rowStyle}>
              <div className="col-1-10">
                <i className="far fa-clock activityInfoIcon" />
              </div>
              <div className="col-9-10">
                <div className="activityInfoDescription">
                  {activityRequest.startTime} - {activityRequest.endTime}
                </div>
              </div>
            </div>
            {this.renderChildren()}
          </div>
          {userIsCreator || <div>
            <div className="row no-gutters" style={rowStyle}>
              <div className="col-5-10">
                YES
              </div>
              <div className="col-5-10">
                IGNORE
              </div>
            </div>
          </div>}
        </div>
      </React.Fragment>
    ) : (
      <LoadingSpinner />
    );
  }
}

export default withSnackbar(withStyles(styles)(withLanguage(ActivityRequestScreen)));

ActivityRequestScreen.propTypes = {
  history: PropTypes.object,
  language: PropTypes.string,
  match: PropTypes.object,
  classes: PropTypes.object,
  enqueueSnackbar: PropTypes.func
};
