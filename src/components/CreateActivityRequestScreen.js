import React from "react";
import PropTypes from "prop-types";
import withLanguage from "./LanguageContext";
import Texts from "../Constants/Texts";
import BackNavigation from "./BackNavigation";
import CreateActivityRequestStepper from "./CreateActivityRequestStepper";

const CreateActivityRequestScreen = ({ language, history }) => {
  const texts = Texts[language].createActivityRequestScreen;
  return (
    <div id="createActivityRequestContainer">
      <BackNavigation
        title={texts.backNavTitle}
        onClick={() => history.goBack()}
      />
      <CreateActivityRequestStepper />
    </div>
  );
};

CreateActivityRequestScreen.propTypes = {
  language: PropTypes.string,
  history: PropTypes.object
};

export default withLanguage(CreateActivityRequestScreen);
