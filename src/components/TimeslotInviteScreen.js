import React from "react";
import axios from "axios";
import { withSnackbar } from "notistack";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import * as path from "lodash.get";

import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import Log from "./Log";

import ConfirmDialog from "./ConfirmDialog";
import LoadingSpinner from "./LoadingSpinner";
import PersonInvite from "./PersonInvite";

const styles = () => ({
  avatar: {
    width: "3rem",
    height: "3rem"
  }
});


class TimeslotInviteScreen extends React.Component {
  state = {
    fetchedData: false,
    confirmDialogIsOpen: false,
    confirmInviteProfile: {},
    profiles: [],
    timeslot: {
      extendedProperties: {
        shared: {
          parents: [],
          children: []
        }
      }
    },
  };

  async componentDidMount() {
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const { history, match: { params: { groupId, activityId, timeslotId } }, enqueueSnackbar } = this.props;
    try {

      const timeslotPromise = axios
        .get(`/api/groups/${groupId}/activities/${activityId}/timeslots/${timeslotId}`)
        .then(response => {
          const timeslot = response.data;
          const { shared } = timeslot.extendedProperties;
          shared.parents = JSON.parse(shared.parents);
          shared.children = JSON.parse(shared.children);
          return timeslot
        });


      const [parentIds, childIds, usersChildren] = await Promise.all([
        axios
          .get(`/api/groups/${groupId}/members`)
          .then(response => response.data
            .filter(m => m.group_accepted && m.user_accepted)
            .map(m => m.user_id)),
        axios
          .get(`/api/groups/${groupId}/children`)
          .then(response => response.data),
        axios
          .get(`/api/users/${userId}/children`)
          .then(response => response.data
            .map(child => child.child_id))
      ])

      const profilesPromise = Promise.all([

        axios
          .get("/api/profiles", {
            params: { ids: parentIds, searchBy: "ids" }
          })
          .then(response => {
            return response.data.map(parent => {
              return {
                user_id: parent.user_id,
                image: path(parent, ["image", "path"]),
                name: `${parent.given_name} ${parent.family_name}`,
                given_name: parent.given_name,
                family_name: parent.family_name,
                type: 'parent'
              };
            }).filter(parent =>
              parent.user_id !== userId
            );
          }),

        axios
          .get("/api/children", {
            params: { ids: childIds }
          })
          .then(response => {
            return response.data.map(child => {
              return {
                child_id: child.child_id,
                image: path(child, ["image", "path"]),
                name: `${child.given_name} ${child.family_name}`,
                given_name: child.given_name,
                family_name: child.family_name,
                type: 'child'
              };
            }).filter(child =>
              !usersChildren.includes(child.child_id)
            );
          })

      ]).then(([p, c]) => p.concat(c));

      this.setState({
        fetchedData: true,
        timeslot: await timeslotPromise,
        profiles: await profilesPromise
      });

      Log.trace(this.state);
    }
    catch (error) {
      Log.error(error);
      history.goBack();
      enqueueSnackbar('ERROR');
    }
  }

  handleGoBack = () => {
    const { history } = this.props;
    history.goBack();
  };

  handleInvite = (profile) => {
    this.setState({ confirmDialogIsOpen: true, confirmInviteProfile: profile })
  }

  handleConfirmDialogClose = async (choice) => {
    const { confirmDialogIsOpen, confirmInviteProfile: profile } = this.state;

    if (confirmDialogIsOpen && choice === 'agree') {
      const { match: { params: { groupId, activityId, timeslotId } }, enqueueSnackbar, language } = this.props;
      const texts = Texts[language].timeslotInviteScreen;
      const inviteeId = profile.type === 'parent' ? profile.user_id : profile.child_id;
      axios
        .post(`/api/groups/${groupId}/activities/${activityId}/timeslots/${timeslotId}/invites`, {
          invitees: [inviteeId]
        })
        .then(() => {
          enqueueSnackbar(texts.inviteSent);
        })
        .catch(error => {
          enqueueSnackbar(texts.inviteFailde);
          Log.error(error);
        });
    }
    this.setState({ confirmDialogIsOpen: false, confirmInviteProfile: {} });
  }

  renderLetters = () => {
    const { profiles } = this.state;
    const { match: { groupId } } = this.props;
    const sortedItems = [].concat(profiles).sort((a, b) => `${a.name}` < `${b.name}` ? -1 : 1);
    const itemsLength = profiles.length;
    const letterIndices = {};
    const letters = [];
    for (let i = 0; i < itemsLength; i += 1) {
      const name = sortedItems[i].given_name;
      const letter = name[0].toUpperCase();
      if (letters.indexOf(letter) === -1) {
        letters.push(letter);
      }
      if (letterIndices[letter] === undefined) letterIndices[letter] = [];
      letterIndices[letter].push(i);
    }

    return letters.map(letter => (
      <li key={letter}>
        <div className="contactLetter">{letter}</div>
        <ul>
          {letterIndices[letter].map(itemIndex => (
            <li key={itemIndex} className="contactLiContainer">
              <PersonInvite
                profile={profiles[itemIndex]}
                groupId={groupId}
                handleInvite={this.handleInvite}
              />
            </li>
          ))}
        </ul>
      </li>
    ));
  };

  render() {
    const { language } = this.props;
    const texts = Texts[language].timeslotInviteScreen;
    const {
      timeslot,
      fetchedData,
      confirmDialogIsOpen,
    } = this.state;
    return fetchedData ? (
      <React.Fragment>
        <ConfirmDialog
          title={texts.confirmInvite}
          isOpen={confirmDialogIsOpen}
          handleClose={this.handleConfirmDialogClose}
        />
        <div id="activityHeaderContainer" className="row no-gutters">
          <div className="col-2-10">
            <button
              type="button"
              className="transparentButton center"
              onClick={this.handleGoBack}
            >
              <i className="fas fa-arrow-left" />
            </button>
          </div>
          <div className="col-6-10">
            <h1 className="center">{texts.title} {timeslot.summary}</h1>
          </div>
        </div>
        <div className="membersContainer">
          {this.renderLetters()}
        </div>
      </React.Fragment>
    ) : (
      <LoadingSpinner />
    );
  }
}

export default withStyles(styles)(withSnackbar(withLanguage(TimeslotInviteScreen)));

TimeslotInviteScreen.propTypes = {
  language: PropTypes.string,
  history: PropTypes.object,
  enqueueSnackbar: PropTypes.func,
  classes: PropTypes.object,
  match: PropTypes.object
};
