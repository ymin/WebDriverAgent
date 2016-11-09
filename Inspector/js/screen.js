/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import React from 'react';
import HTTP from 'js/http';

require('css/screen.css');

const HOMESCREEN = 'homescreen';
const STATUS = 'status';
const ORIENTATION_ENDPOINT = 'orientation';
const SCREENSHOT_ENDPOINT = 'screenshot';


class Screen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      sessionId: {},
      windowSize: {},
    };
  }

  componentDidMount() {
    this.statusCheck();
    var sleep = new Promise((resolve, reject) => { 
      setTimeout(resolve, 2000, "one"); 
    }); 

    Promise.all([sleep]).then(values => { 
      this.getScreenWindowSize();
    });
  }

  statusCheck() {
    HTTP.fget(STATUS, (data) => {
      console.log('sessionId', data.sessionId);
      this.setState({
        sessionId: data.sessionId
      });
    })
  }

  getScreenWindowSize() {
    var window_size_path = 'session/'+ this.state.sessionId + '/window/size';
    HTTP.get(window_size_path, (data) => {
      console.log('window_size', data);
      this.setState({
        windowSize: data
      })
    });
  }

  homeSrc() {
    return "image/home_button.png"
  }

  homeButtonStyle() {
    return {
      width: 60,
      height: 60,
    };
  }

  homeClick(i) {
    console.log('i',i);
    HTTP.post(HOMESCREEN, (data) => {
      console.log(data);
    });
    this.manuRefresh();
  }

  refreshAll() {
    if (this.props.onFetchedChange != false) {
      this.props.onFetchedChange(false);
    }
  }

  manuRefresh() {
    this.props.manuRefresh();
  }

  render() {
    return (
      <div id="screen" className="section first">
        <div className="section-caption">
          Screen
        </div>
        <div className="section-content-container">
          <div className="screen-screenshot-container"
            style={this.styleWithScreenSize()}>
            {this.renderScreenshot()}
            {this.renderHighlightedNode()}
          </div>
        </div>
        <div className="section-button">
          <div onClick={this.homeClick.bind(this)}>
            <img className="home-button"
            src={this.homeSrc()}
            style={this.homeButtonStyle()}/>
          </div>
          <button className="home-button"
            onClick={this.manuRefresh.bind(this)}>
          Refresh
          </button>

        </div>
      </div>
    );
  }

  styleWithScreenSize() {
    var screenshot = this.screenshot();
    return {
      width: screenshot.width * screenshot.scale,
      height: screenshot.height * screenshot.scale,
    };
  }

  screenshot() {
    return this.props.screenshot ? this.props.screenshot : {};
  }

  screenClick(i) {
   
    var screenshot = this.styleWithScreenSize();
    var screen_size = this.state.windowSize;
    console.log('screen_size', screen_size);
    console.log(i.nativeEvent.offsetX);
    console.log(i.nativeEvent.offsetY);
    console.log(screenshot);
    var realX = i.nativeEvent.offsetX / screenshot.width * screen_size.width;
    var realY = i.nativeEvent.offsetY / screenshot.height * screen_size.height;
    console.log(realX);
    console.log(realY);
    var tap_on_path = 'session/' + this.state.sessionId + '/tap/0';
    HTTP.fpost(tap_on_path, JSON.stringify({x: realX, y: realY}), (data) => {
      console.log(data);
    });
    console.log('props', this.props); 
    this.manuRefresh();
  }

  renderScreenshot() {
    return ( 
      <div onClick={this.screenClick.bind(this)} >
        <img
          className="screen-screenshot"
          src={this.screenshot().source}
          style={this.styleWithScreenSize()} />
      </div>
    );
  }

  renderHighlightedNode() {
    if (this.props.highlightedNode == null) {
      return null;
    }
    
    const rect = this.props.highlightedNode.rect;
    return (
      <div
        className="screen-highlighted-node"
        style={this.styleForHighlightedNodeWithRect(rect)}/>
    );
  }

  styleForHighlightedNodeWithRect(rect) {
    var screenshot = this.screenshot();

    const elementsMargins = 4;
    const topOffset = screenshot.height;

    var scale = screenshot.scale;
    // Rect attribute use pt, but screenshot use px.
    // So caculate its px/pt scale automatically.
    var pxPtScale = screenshot.width / this.props.rootNode.rect.size.width;

    // hide nodes with rect out of bound
    if (rect.origin.x < 0 || rect.origin.x * pxPtScale >= screenshot.width ||
      rect.origin.y < 0 || rect.origin.y * pxPtScale >= screenshot.height){
        return {}
    }

    return {
      left: rect.origin.x * scale * pxPtScale,
      top: rect.origin.y * scale * pxPtScale - topOffset * scale - elementsMargins,
      width: rect.size.width * scale * pxPtScale,
      height: rect.size.height * scale * pxPtScale,
    };
  }
}

Screen.propTypes = {
  highlightedNode: React.PropTypes.object,
  screenshot: React.PropTypes.object,
  fetch: React.PropTypes.object,
};

module.exports = Screen;
