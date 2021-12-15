import React from "react";
import autosize from "autosize";
import axios from "axios";
import DayPicker from "react-day-picker";
import { CirclePicker } from "react-color";
import PropTypes from "prop-types";
import * as path from "lodash.get";
import MomentLocaleUtils from "react-day-picker/moment";
import "../styles/DayPicker.css";

import Texts from "../Constants/Texts";
import LoadingSpinner from "./LoadingSpinner";
import withLanguage from "./LanguageContext";
import Log from "./Log";

import CreateActivityRequestChildren from "./CreateActivityRequestChildren";

const _ = require("lodash");

const modifiersStyles = {
  selected: {
    backgroundColor: "#00838F"
  }
};

const Navbar = ({ onPreviousClick, onNextClick }) => {
  function handlePrevNav() {
    onPreviousClick();
  }
  function handleNextNav() {
    onNextClick();
  }
  return (
    <div className="">
      <span
        role="button"
        tabIndex={-42}
        className="dayPickerNavButton dayPickerPrevNav"
        onClick={handlePrevNav}
      />
      <span
        role="button"
        tabIndex={-43}
        className="dayPickerNavButton dayPickerNextNav"
        onClick={handleNextNav}
      />
    </div>
  );
};

class EditActivityRequestScreen extends React.Component {
  state = {
    fetchedData: false
  };

  async componentDidMount() {
    const { match: { params: { activityRequestId, groupId } }, history } = this.props;

    try {
      const activityRequest = await axios
        .get(`/api/groups/${groupId}/activityrequests/${activityRequestId}`)
        .then(response => response.data);

      const requestersChildIds = await axios
        .get(`/api/users/${activityRequest.creator_id}/children`)
        .then(response => response.data.map(child => child.child_id));

      const requestersChildren = await axios
        .get("/api/children", { params: { ids: requestersChildIds } })
        .then(response => response.data.map(child => {
          return {
            child_id: child.child_id,
            image: path(child, ["image", "path"]),
            name: `${child.given_name} ${child.family_name}`,
            given_name: child.given_name
          };
        }));

      const { name, description, color, children, date, startTime, endTime } = activityRequest;
      this.setState({
        fetchedData: true,
        activityRequest: { ...activityRequest, date: new Date(activityRequest.date) },
        requestersChildren,
        fields: {
          name,
          description,
          color,
          children,
          date: new Date(date),
          startTime,
          endTime
        },
        validatedInfo: true,
        validatedChildren: true
      });
    }
    catch (error) {
      Log.error(error);
      history.goBack();
    }
  }

  validate = fields => {
    const { name, color, date, startTime, endTime } = fields;
    const samePeriod =
      Math.floor(startTime.substr(0, startTime.indexOf(":")) / 12) ===
      Math.floor(endTime.substr(0, endTime.indexOf(":")) / 12);
    const invalidTime = samePeriod && startTime >= endTime;
    return name && color && date && startTime && endTime && !invalidTime;
  };

  handleChange = event => {
    var { fields } = this.state;
    const { name, value } = event.target;
    fields[name] = value;
    const validatedInfo = this.validate(fields);
    this.setState({ fields, validatedInfo });
  };

  handleColorChange = color => {
    var { fields } = this.state;
    fields.color = color.hex;
    this.setState({ fields });
  };

  handleChildrenChange = (state, valid) => {
    var { fields } = this.state;
    fields.children = state.selectedChildren;
    this.setState({ fields, validatedChildren: valid });
  }

  handleDayClick = async (day, { selected }) => {
    var { fields } = this.state;

    if (!selected) {
      fields.date = day;
    } else {
      fields.date = null;
    }

    const validatedInfo = this.validate(fields);
    this.setState({ fields, validatedInfo });
  }

  allValid() {
    const { validatedInfo, validatedChildren } = this.state;
    return validatedInfo && validatedChildren;
  }

  modifiedFields() {
    const { fields, activityRequest } = this.state;
    return _.omitBy(fields, (v, k) => activityRequest[k] === v);
  }

  handleSave = () => {
    const { match: { params: { activityRequestId, groupId } }, history } = this.props;
    const fields = this.modifiedFields();
    if (this.allValid()) {
      axios
        .patch(`/api/groups/${groupId}/activityrequests/${activityRequestId}`, fields)
        .then(response => {
          Log.info(response);
          history.goBack();
        })
        .catch(error => {
          Log.error(error);
          history.goBack();
        });
      this.setState({ fetchedData: false });
    }
  };

  render() {
    const {
      fetchedData,
      fields,
      requestersChildren
    } = this.state;
    const { language, history } = this.props;
    const texts = Texts[language].editActivityRequestScreen;
    return fetchedData ? (
      <React.Fragment>
        <div className="row no-gutters" id="editActivityHeaderContainer">
          <div className="col-2-10">
            <button
              className="transparentButton center"
              type="button"
              onClick={() => history.goBack()}
            >
              <i className="fas fa-arrow-left" />
            </button>
          </div>
          <div className="col-6-10">
            <h1 className="verticalCenter">{texts.backNavTitle}</h1>
          </div>
          <div className="col-2-10">
            <button
              type="button"
              className="transparentButton center"
              style={this.allValid() ? {} : { opacity: 0.5 }}
              onClick={this.handleSave}
            >
              <i className="fas fa-check" />
            </button>
          </div>
        </div>
        <div id="editActivityMainContainer">
          <div className="row no-gutters">
            <div className="col-2-10">
              <i className="fas fa-clipboard-check center" />
            </div>
            <div className="col-8-10">
              <input
                type="text"
                name="name"
                placeholder={texts.name}
                value={fields.name}
                className="verticalCenter"
                onChange={this.handleChange}
              />
            </div>
          </div>
          <div
            className="row no-gutters"
            style={{ height: "auto", minHeight: "6rem" }}
          >
            <div className="col-2-10">
              <i className="fas fa-align-left center" />
            </div>
            <div className="col-8-10">
              <textarea
                rows="1"
                name="description"
                className="verticalCenter"
                placeholder={texts.description}
                value={fields.description}
                onChange={event => {
                  this.handleChange(event);
                  autosize(document.querySelectorAll("textarea"));
                }}
              />
            </div>
          </div>
          <div className="row no-gutters">
            <div className="col-2-10">
              <i
                className="fas fa-palette center"
                style={{ color: fields.color }}
                alt="palette icon"
              />
            </div>
            <div className="col-8-10">
              <h1 className="verticalCenter" style={{ color: fields.color }}>
                {texts.color}
              </h1>
            </div>
          </div>
          <div className="row no-gutters" style={{ marginBottom: "4rem" }}>
            <div className="col-2-10" />
            <div className="col-8-10">
              <CirclePicker
                width="100%"
                color={fields.color}
                onChange={this.handleColorChange}
              />
            </div>
          </div>
          <div className="row no-gutters">
            <div className="col-2-10">
              <i className="fas fa-child center" />
            </div>
            <div className="col-8-10">
              <CreateActivityRequestChildren
                usersChildren={requestersChildren}
                selectedChildren={fields.children}
                handleSubmit={this.handleChildrenChange}
              />
            </div>
          </div>
          <div className="row no-gutters" style={{ height: "auto" }}>
            <div className="col-2-10">
              <i className="fas fa-calendar center" />
            </div>
            <div className="col-6-10">
              <div style={{ width: "100%", fontSize: "1.5rem" }}>
                <DayPicker
                  className="horizontalCenter"
                  localeUtils={MomentLocaleUtils}
                  locale={language}
                  selectedDays={fields.date ? [fields.date] : []}
                  onDayClick={this.handleDayClick}
                  modifiersStyles={modifiersStyles}
                  navbarElement={<Navbar />}
                />
              </div>
            </div>
          </div>
          <div className="row no-gutters">
            <div className="col-2-10">
              <i className="fas fa-clock center" />
            </div>
            <div className="col-2-10">
              <h4 className="verticalCenter">{texts.from}</h4>
            </div>
            <div className="col-6-10">
              <input
                name="startTime"
                type="time"
                value={fields.startTime}
                onChange={this.handleChange}
                className="expandedTimeslotTimeInput"
              />
            </div>
          </div>
          <div className="row no-gutters">
            <div className="col-2-10" />
            <div className="col-2-10">
              <h4 className="verticalCenter">{texts.to}</h4>
            </div>
            <div className="col-6-10">
              <input
                name="endTime"
                type="time"
                value={fields.endTime}
                onChange={this.handleChange}
                className="expandedTimeslotTimeInput form-control"
              />
            </div>
          </div>
        </div>
      </React.Fragment>
    ) : (
      <LoadingSpinner />
    );
  }
}

export default withLanguage(EditActivityRequestScreen);

EditActivityRequestScreen.propTypes = {
  history: PropTypes.object,
  language: PropTypes.string,
  match: PropTypes.object
};
