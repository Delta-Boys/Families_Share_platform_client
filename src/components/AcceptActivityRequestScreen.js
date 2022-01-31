import React from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { CirclePicker } from "react-color";
import autosize from "autosize";
import { withSnackbar } from "notistack";
import { Select, MenuItem } from "@material-ui/core";
import {
  MenuBook,
  EmojiNature,
  Museum,
  SportsBaseball,
  Commute,
  Mood,
  Cake,
  Event,
  ChildCare
} from "@material-ui/icons";

import Texts from "../Constants/Texts";
import withLanguage from "./LanguageContext";
import LoadingSpinner from "./LoadingSpinner";
import Log from "./Log";


class AcceptActivityRequestScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fetchedData: false,
      activityRequest: {},
      name: "",
      description: "",
      location: "",
      color: "",
      category: "other",
      validated: true,
    };
  }

  async componentDidMount() {
    const { match: { params: { groupId, activityRequestId } } } = this.props;

    const activityRequest = await axios
      .get(`/api/groups/${groupId}/activityrequests/${activityRequestId}`)
      .then(response => response.data);

    const { name, description, color } = activityRequest;

    this.setState({ activityRequest, fetchedData: true, name, description, color });
  }

  handleChange = event => {
    const state = Object.assign({}, this.state);
    const { name, value } = event.target;

    state[name] = value;
    state.validated = state.color && state.name;

    this.setState(state);
  };

  handleColorChange = color => {
    this.setState({ color: color.hex });
  };

  handleConfirm = () => {
    const { match: { params: { groupId } }, history, enqueueSnackbar, language } = this.props;
    const { validated } = this.state;
    const texts = Texts[language].acceptActivityRequestScreen;
    if (validated) {
      this.setState({ fetchedActivity: false });

      const activity = this.formatDataToActivity();
      const events = this.formatDataToEvents();

      this.setState({ creating: true });
      axios
        .post(`/api/groups/${groupId}/activities`, { activity, events })
        .then(response => {
          const { status, id } = response.data
          if (status === "pending") {
            enqueueSnackbar(texts.pendingMessage, { variant: "info" });
          }
          Log.info(response);
          history.replace(`/groups/${groupId}/activities/${id}`);
        })
        .catch(error => {
          Log.error(error);
          history.goBack();
        });
    }
  };

  formatDataToActivity = () => {
    const { match: { params: { groupId } } } = this.props;
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const { name, color, location, description } = this.state;
    return {
      group_id: groupId,
      creator_id: userId,
      name,
      color,
      description,
      location,
      repetition: false,
      repetitionType: "",
      different_timeslots: false,
      greenpass_required: false,
    };
  };

  formatDataToEvents = () => {
    const { match: { params: { groupId } } } = this.props;
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const { name, color, location, description, category, activityRequest } = this.state;

    const { startTime, endTime, date } = activityRequest;
    const dstart = new Date(date);
    const dend = new Date(date);

    dstart.setHours(startTime.substr(0, startTime.indexOf(":")));
    dstart.setMinutes(
      startTime.substr(startTime.indexOf(":") + 1, startTime.length - 1)
    );
    dend.setHours(endTime.substr(0, endTime.indexOf(":")));
    dend.setMinutes(
      endTime.substr(endTime.indexOf(":") + 1, endTime.length - 1)
    );
    if (
      startTime.substr(0, startTime.indexOf(":")) >
      endTime.substr(0, endTime.indexOf(":"))
    ) {
      dend.setDate(dend.getDate() + 1);
    }

    return [{
      description,
      location,
      summary: name,
      start: {
        dateTime: dstart,
        date: null
      },
      end: {
        dateTime: dend,
        date: null
      },
      extendedProperties: {
        shared: {
          requiredParents: 1,
          requiredChildren: 0,
          cost: "",
          parents: JSON.stringify([userId]),
          children: JSON.stringify([]),
          externals: JSON.stringify([]),
          status: "ongoing",
          link: "",
          activityColor: color,
          category,
          groupId,
          repetition: "none",
          start: startTime.substr(0, startTime.indexOf(":")),
          end: endTime.substr(0, startTime.indexOf(":"))
        }
      }
    }];
  };

  render() {
    const { history, language } = this.props;
    const {
      fetchedData,
      name,
      description,
      location,
      color,
      category,
      validated,
    } = this.state;
    const texts = Texts[language].acceptActivityRequestScreen;
    const textsTimeslots = Texts[language].expandedTimeslotEdit;
    const rowStyle = { minHeight: "5rem" };
    return fetchedData ? (
      < React.Fragment >
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
              style={validated ? {} : { opacity: 0.5 }}
              onClick={this.handleConfirm}
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
                value={name}
                className="verticalCenter"
                onChange={this.handleChange}
              />
            </div>
          </div>
          <div className="row no-gutters">
            <div className="col-2-10">
              <i className="fas fa-map-marker-alt center" />
            </div>
            <div className="col-8-10">
              <input
                type="text"
                name="location"
                placeholder={texts.location}
                value={location}
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
                value={description}
                onChange={event => {
                  this.handleChange(event);
                  autosize(document.querySelectorAll("textarea"));
                }}
              />
            </div>
          </div><div className="row no-gutters" style={rowStyle}>
            <div className="col-2-10">
              <i className="fas fa-bookmark center" />
            </div>
            <div className="col-8-10">
              <Select
                value={category}
                onChange={this.handleChange}
                inputProps={{
                  name: "category"
                }}
                className="verticalCenter"
              >
                <MenuItem value="learning">
                  <MenuBook />
                  <div className="categoryText">{textsTimeslots.learning}</div>
                </MenuItem>
                <MenuItem value="nature">
                  <EmojiNature />
                  <div className="categoryText">{textsTimeslots.nature}</div>
                </MenuItem>
                <MenuItem value="tourism">
                  <Museum />
                  <div className="categoryText">{textsTimeslots.tourism}</div>
                </MenuItem>
                <MenuItem value="hobby">
                  <SportsBaseball />
                  <div className="categoryText">{textsTimeslots.hobby}</div>
                </MenuItem>
                <MenuItem value="accompanying">
                  <Commute />
                  <div className="categoryText">{textsTimeslots.accompanying}</div>
                </MenuItem>
                <MenuItem value="entertainment">
                  <Mood />
                  <div className="categoryText">{textsTimeslots.entertainment}</div>
                </MenuItem>
                <MenuItem value="parties">
                  <Cake />
                  <div className="categoryText">{textsTimeslots.parties}</div>
                </MenuItem>
                <MenuItem value="coplaying">
                  <Event />
                  <div className="categoryText">{textsTimeslots.coplaying}</div>
                </MenuItem>
                <MenuItem value="other">
                  <ChildCare />
                  <div className="categoryText">{textsTimeslots.other}</div>
                </MenuItem>
              </Select>
            </div>
          </div>
          <div className="row no-gutters">
            <div className="col-2-10">
              <i
                className="fas fa-palette center"
                style={{ color }}
                alt="palette icon"
              />
            </div>
            <div className="col-8-10">
              <h1 className="verticalCenter" style={{ color }}>
                {texts.color}
              </h1>
            </div>
          </div>
          <div className="row no-gutters" style={{ marginBottom: "4rem" }}>
            <div className="col-2-10" />
            <div className="col-8-10">
              <CirclePicker
                width="100%"
                color={color}
                onChange={this.handleColorChange}
              />
            </div>
          </div>

        </div>
      </React.Fragment >
    ) : (
      <LoadingSpinner />
    );
  }
}

export default withSnackbar(withLanguage(AcceptActivityRequestScreen));

AcceptActivityRequestScreen.propTypes = {
  history: PropTypes.object,
  language: PropTypes.string,
  match: PropTypes.object,
  enqueueSnackbar: PropTypes.func
};
