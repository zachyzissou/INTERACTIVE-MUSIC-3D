"use client";
import React from "react";
import styles from "../styles/zoomHud.module.css";
import ui from "../styles/ui.module.css";

const ZoomHUD: React.FC = () => {
  return (
    <div className={`${styles.hud} ${ui.glass}`}>Scroll or pinch to zoom</div>
  );
};

export default ZoomHUD;
