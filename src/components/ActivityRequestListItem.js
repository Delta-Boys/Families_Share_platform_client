import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import moment from "moment";
import withLanguage from "./LanguageContext";

class ActivityRequestListItem extends React.Component {
  constructor(props) {
    super(props);
    const { activityRequest } = this.props;
    this.state = { activityRequest };
  }

  handleActivityRequestClick = event => {
    const { history, groupId } = this.props;
    history.push(`/groups/${groupId}/activityRequests/${event.currentTarget.id}`);
  };

  getDateString = () => {
    const { activityRequest } = this.state;

    return moment(activityRequest.date).format("DD MMMM YYYY");
  };

  render() {
    const { activityRequest } = this.state;
    return (
      <React.Fragment>
        <div
          role="button"
          tabIndex="0"
          onKeyPress={this.handleActivityRequestClick}
          className="row no-gutters"
          style={{ minHheight: "7rem", cursor: "pointer" }}
          id={activityRequest._id}
          onClick={this.handleActivityRequestClick}
        >
          <div className="col-2-10">
            <i
              style={{
                fontSize: "3rem",
                color: activityRequest.color
              }}
              className="fas fa-question center"
            />
          </div>
          <div
            className="col-6-10"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
          >
            <div className="verticalCenter">
              <div className="row no-gutters">
                <h1>{activityRequest.name}</h1>
              </div>
              <div className="row no-gutters">
                <i
                  className="far fa-calendar-alt"
                  style={{ marginRight: "1rem" }}
                />
                <h2>{this.getDateString()}</h2>
              </div>
            </div>
          </div>
          <div
            className="col-2-10"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
          >
            <i
              style={{ fontSize: "2rem" }}
              className="fas fa-chevron-right center"
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(withLanguage(ActivityRequestListItem));

ActivityRequestListItem.propTypes = {
  activityRequest: PropTypes.object,
  groupId: PropTypes.string,
  history: PropTypes.object,
  language: PropTypes.string
};
