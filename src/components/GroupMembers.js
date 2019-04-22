import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import GroupMembersList from "./GroupMembersList";
import GroupMembersAdminOptions from "./GroupMembersAdminOptions";
import LoadingSpinner from "./LoadingSpinner";
import Log from "./Log";

const getGroupMembers = groupId => {
  return axios
    .get(`/groups/${groupId}/members`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return [];
    });
};
const getGroupSettings = groupId => {
  return axios
    .get(`/groups/${groupId}/settings`)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      Log.error(error);
      return {
        open: ""
      };
    });
};

class GroupMembers extends React.Component {
  constructor(props) {
    super(props);
    this.state = { fetchedGroupMembers: false, group: this.props.group };
  }

  async componentDidMount() {
    const groupId = this.state.group.group_id;
    const members = await getGroupMembers(groupId);
    const acceptedMembers = [];
    let pendingRequests = 0;
    const { userIsAdmin } = this.props;
    members.forEach(member => {
      if (member.user_accepted && member.group_accepted) {
        acceptedMembers.push(member);
      } else if (member.user_accepted && !member.group_accepted) {
        pendingRequests++;
      }
    });
    const settings = await getGroupSettings(groupId);
    this.setState({
      members: acceptedMembers,
      settings,
      userIsAdmin,
      pendingRequests,
      fetchedGroupMembers: true
    });
  }

  handlePendingRequests = () => {
    this.props.history.push(
      `/groups/${this.state.group.group_id}/members/pending`
    );
  };

  render() {
    return this.state.fetchedGroupMembers ? (
      <div id="groupMembersContainer">
        <div className="row no-gutters" id="groupMembersHeaderContainer">
          <div className="col-2-10">
            <button
              className="transparentButton center"
              onClick={() => this.props.history.goBack()}
            >
              <i className="fas fa-arrow-left" />
            </button>
          </div>
          <div className="col-5-10 ">
            <h1 className="verticalCenter">{this.state.group.name}</h1>
          </div>
          <div className="col-3-10 ">
            {this.state.userIsAdmin && (
              <button
                type="button"
                className="transparentButton center"
                onClick={this.handlePendingRequests}
              >
                <i className="fas fa-user-friends" />
                {this.state.pendingRequests > 0 && (
                  <span className="badge">{this.state.pendingRequests}</span>
                )}
              </button>
            )}
          </div>
        </div>
        {this.state.userIsAdmin && (
          <GroupMembersAdminOptions
            groupIsOpen={this.state.settings.open}
            groupId={this.state.group.group_id}
          />
        )}
        <GroupMembersList
          members={this.state.members}
          groupId={this.state.group.group_id}
          userIsAdmin={this.state.userIsAdmin}
        />
      </div>
    ) : (
      <LoadingSpinner />
    );
  }
}

export default GroupMembers;

GroupMembers.propTypes = {
  group: PropTypes.object
};
