import React from "react";
import ChildProfileHeader from "./ChildProfileHeader";
import ChildProfileInfo from "./ChildProfileInfo";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";

const getChild = (userId, childId) => {
  return axios
    .get("/users/" + userId + "/children/" + childId)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.log(error);
      return {
        child_id: childId,
        image: { path: "" },
        background: "",
        given_name: "",
        family_name: "",
        birthdate: new Date(),
        gender: "unspecified",
        allergies: "",
        other_info: "",
        special_needs: ""
      };
    });
};
const getParents = (userId, childId) => {
  return axios
    .get("/users/" + userId + "/children/" + childId + "/parents")
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.log(error);
      return [];
    });
};

class ChildProfileScreen extends React.Component {
  state = { fetchedChildData: false, child: {} };

  async componentDidMount() {
    const profileId = this.props.match.params.profileId;
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const childId = this.props.match.params.childId;
    const child = await getChild(profileId, childId);
    child.parents = await getParents(profileId, childId);
    child.showAdditional = userId === profileId;
    this.setState({ child , fetchedChildData: true });
	}
	handleAddParent = (parent) => {
		const child = this.state.child
		child.parents.push(parent)
		this.setState({ child })
	}
	handleDeleteParent = (index) => {
		const child = this.state.child
		child.parents.splice(index,1)
		this.setState({ child })
		if(child.parents.length===0) this.props.history.goBack()
	}
  render() {
    const child = this.state.child;
    return this.state.fetchedChildData ? (
      <React.Fragment>
        <ChildProfileHeader
          background={child.background}
          photo={child.image.path}
          name={child.given_name + " " + child.family_name}
        />
        <ChildProfileInfo
          birthdate={child.birthdate}
          parents={child.parents}
          showAdditional={child.showAdditional}
          specialNeeds={child.special_needs}
          otherInfo={child.other_info}
          allergies={child.allergies}
					gender={child.gender}
					handleAddParent={this.handleAddParent}
					handleDeleteParent={this.handleDeleteParent}
        />
      </React.Fragment>
    ) : (
      <LoadingSpinner />
    );
  }
}

export default ChildProfileScreen;
