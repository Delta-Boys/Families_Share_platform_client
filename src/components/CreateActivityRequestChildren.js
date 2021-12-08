import React from "react";
import PropTypes from "prop-types";
import withLanguage from "./LanguageContext";
import Texts from "../Constants/Texts";

import TimeslotSubcribe from "./TimeslotSubcribe";

class CreateActivityRequestChildren extends React.Component {
  constructor(props) {
    super(props);
    const {
      handleSubmit,
      selectedChildren
    } = this.props;
    this.state = { selectedChildren };
    handleSubmit(this.state, this.validate(this.state));
  }

  submit() {
  }

  validate = state => {
    if (state.selectedChildren.length > 0) {
      return true;
    }
    return false;
  };

  handleSelectChild = (id, type) => {
    const { handleSubmit } = this.props;
    const { selectedChildren } = this.state;

    const state = { ...this.state, selectedChildren: [...selectedChildren, id] }

    handleSubmit(state, this.validate(state));
    this.setState(state);
  }

  handleDeselectChild = (id, type) => {
    const { handleSubmit } = this.props;
    const { selectedChildren } = this.state;

    const state = { ...this.state, selectedChildren: selectedChildren.filter(subId => subId !== id) };

    handleSubmit(state, this.validate(state));
    this.setState(state);
  }

  render() {
    const { language, usersChildren } = this.props;
    const { selectedChildren } = this.state;
    const texts = Texts[language].createActivityRequestChildren;
    return (
      <div id="createActivityRequestChildrenContainer">
        <p>{usersChildren.length === 0 ?
          texts.noChildrenError : ""}</p>
        <div className="row no-gutters">
          {usersChildren.map((child, index) => (
            <TimeslotSubcribe
              key={index}
              name={child.name}
              image={child.image}
              subscribed={selectedChildren.includes(child.child_id)}
              id={child.child_id}
              type="child"
              handleSubscribe={this.handleSelectChild}
              handleUnsubscribe={this.handleDeselectChild}
            />
          ))}
        </div>
      </div>
    );
  }
}

CreateActivityRequestChildren.propTypes = {
  usersChildren: PropTypes.array,
  selectedChildren: PropTypes.array,
  handleSubmit: PropTypes.func,
  language: PropTypes.string
};

export default withLanguage(CreateActivityRequestChildren);
