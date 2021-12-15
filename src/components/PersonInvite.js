import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { withSnackbar } from "notistack";
import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import Avatar from "./Avatar";

class PersonInvite extends React.Component {
  handleRedirect = (profile) => {
    const { history } = this.props;
    if (profile.type === 'parent') {
      history.push(`/profiles/${profile.user_id}/info`);
    }
    else {
      history.push(`/profiles/groupmember/children/${profile.child_id}`);
    }
  };

  render() {
    const { language, profile, handleInvite } = this.props;
    const texts = Texts[language].personInvite;
    return (
      <React.Fragment>
        <div id="contactContainer" className="row no-gutters">
          <div className="col-2-10">
            <Avatar
              thumbnail={profile.image}
              route={`/profiles/${profile.user_id}/info`}
              disabled={profile.suspended}
            />
          </div>
          <div className="col-6-10">
            <div
              role="button"
              tabIndex={-42}
              id="contactInfoContainer"
              className="center"
              onClick={() =>
                this.handleRedirect(profile)
              }
            >
              <h1>{`${profile.given_name} ${profile.family_name}`}</h1>
              <h2>{profile.admin ? texts.administrator : ""}</h2>
            </div>
          </div>
          <div id="contactIconsContainer" className="col-2-10">
            <button
              type="button"
              onClick={() => handleInvite(profile)}
              className="transparentButton verticalCenter"
            >
              <i className="fas fa-plus" />
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default withSnackbar(withRouter(withLanguage(PersonInvite)));

PersonInvite.propTypes = {
  profile: PropTypes.object,
  groupId: PropTypes.string,
  handleInvite: PropTypes.func,
  language: PropTypes.string,
  history: PropTypes.object,
  enqueueSnackbar: PropTypes.func
};
