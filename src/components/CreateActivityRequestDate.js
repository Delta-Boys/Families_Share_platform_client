import React from "react";
import DayPicker from "react-day-picker";
import PropTypes from "prop-types";
import MomentLocaleUtils from "react-day-picker/moment";
import "../styles/DayPicker.css";
import { withSnackbar } from "notistack";

import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";

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

class CreateActivityRequestDate extends React.Component {
  constructor(props) {
    super(props);
    const {
      handleSubmit,
      selectedDay,
      startTime,
      endTime
    } = this.props;

    this.state = {
      selectedDay,
      startTime,
      endTime
    };
    handleSubmit(this.state, this.validate(this.state));
  }

  validate = state => {
    const { startTime, endTime } = state;
    const samePeriod =
      Math.floor(startTime.substr(0, startTime.indexOf(":")) / 12) ===
      Math.floor(endTime.substr(0, endTime.indexOf(":")) / 12);
    const invalidTime = samePeriod && startTime >= endTime;
    return state.selectedDay !== null && !invalidTime;
  }

  handleDayClick = async (day, { selected }) => {
    var { selectedDay } = this.state;
    const { handleSubmit } = this.props;

    if (!selected) {
      selectedDay = day;
    } else {
      selectedDay = null;
    }

    const state = { ...this.state, selectedDay }
    handleSubmit(state, this.validate(state));
    this.setState(state);
  };

  handleTimeChange = event => {
    const { name, value } = event.target;
    const { handleSubmit } = this.props;
    
    const state = {...this.state, [name]: value }
    handleSubmit(state, this.validate(state));
    this.setState(state);
  };

  render() {
    const { language } = this.props;
    const { selectedDay, startTime, endTime } = this.state;
    const rowStyle = { margin: "2rem 0" };
    const texts = Texts[language].createActivityRequestDate;
    const navbar = <Navbar />;
    return (
      <div id="createActivityDatesContainer">
        <h1>{texts.header}</h1>
        <div style={{ width: "100%", fontSize: "1.5rem" }}>
          <DayPicker
            className="horizontalCenter"
            localeUtils={MomentLocaleUtils}
            locale={language}
            selectedDays={selectedDay ? [selectedDay] : []}
            onDayClick={this.handleDayClick}
            modifiersStyles={modifiersStyles}
            navbarElement={navbar}
          />
        </div>
        <div className="row no-gutters" style={rowStyle}>
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
              value={startTime}
              onChange={this.handleTimeChange}
              className="expandedTimeslotTimeInput"
            />
          </div>
        </div>
        <div className="row no-gutters" style={rowStyle}>
          <div className="col-2-10" />
          <div className="col-2-10">
            <h4 className="verticalCenter">{texts.to}</h4>
          </div>
          <div className="col-6-10">
            <input
              name="endTime"
              type="time"
              value={endTime}
              onChange={this.handleTimeChange}
              className="expandedTimeslotTimeInput form-control"
            />
          </div>
        </div>
      </div>
    );
  }
}

CreateActivityRequestDate.propTypes = {
  handleSubmit: PropTypes.func,
  selectedDay: PropTypes.instanceOf(Date),
  startTime: PropTypes.object,
  endTime: PropTypes.object,
  language: PropTypes.string,
  enqueueSnackbar: PropTypes.func
};

Navbar.propTypes = {
  onPreviousClick: PropTypes.func,
  onNextClick: PropTypes.func
};

export default withSnackbar(withLanguage(CreateActivityRequestDate));
