import React from "react";
import { Switch, Route } from "react-router-dom";
import axios from "axios";
import Loadable from "react-loadable";
import ProfileHeader from "./ProfileHeader";
import ProfileNavbar from "./ProfileNavbar";
import LoadingSpinner from "./LoadingSpinner";
import Log from "./Log";

const ProfileInfo = Loadable({
  loader: () => import("./ProfileInfo"),
  loading: () => <div />
});
const ProfileChildren = Loadable({
  loader: () => import("./ProfileChildren"),
  loading: () => <div />
});

const getMyChildren = userId => {
  return axios
    .get(`/api/users/${userId}/children`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return [];
    });
};
const getMyProfile = userId => {
  return axios
    .get(`/api/users/${userId}/profile`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return {
        given_name: "",
        family_name: "",
        image: { path: "/images/profiles/user_default_photo.png" },
        address: { street: "", number: "" },
        email: "",
        phone: "",
        phone_type: "",
        visible: false,
        user_id: ""
      };
    });
};

class ProfileScreen extends React.Component {
  state = {
    profile: {},
    children: [],
    activeTab: "",
    fetchedProfile: false
  };

  async componentDidMount() {
    const { profileId } = this.props.match.params;
    const profile = await getMyProfile(profileId);
    const children = await getMyChildren(profileId);
    this.setState({
      fetchedProfile: true,
      children,
      profile
    });
  }

  handleActiveTab = activeTab => {
    this.setState({ activeTab });
  };

  render() {
    const currentPath = this.props.match.url;
    const { profile } = this.state;
    return this.state.fetchedProfile ? (
      <React.Fragment>
        <ProfileHeader
          name={`${profile.given_name} ${profile.family_name}`}
          photo={profile.image.path}
        />
        <React.Fragment>
          <ProfileNavbar renderActiveTab={this.handleActiveTab} />
          <Switch>
            <Route
              exact
              path={`${currentPath}/info`}
              render={props => <ProfileInfo {...props} profile={profile} />}
            />
            <Route
              exact
              path={`${currentPath}/children`}
              render={props => (
                <ProfileChildren
                  {...props}
                  profileId={this.props.match.params.profileId}
                  children={this.state.children}
                />
              )}
            />
          </Switch>
        </React.Fragment>
      </React.Fragment>
    ) : (
      <LoadingSpinner />
    );
  }
}

export default ProfileScreen;
