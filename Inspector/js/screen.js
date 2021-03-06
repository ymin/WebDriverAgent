/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import PropTypes from 'prop-types';
import React from 'react';
import HTTP from 'js/http';

import GestureRecognizer from 'js/gesture_recognizer';

var Button = require('react-button');

require('css/screen.css');

const HOMESCREEN = 'wda/homescreen';
const SWIPE = 'wda/dragfromtoforduration'
const STATUS = 'status';
const ORIENTATION_ENDPOINT = 'orientation';
const SCREENSHOT_ENDPOINT = 'screenshot';

class Screen extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            sessionId: {},
            windowSize: {},
            osInfo: {},
            unlockCode: '0000',
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
                sessionId: data.sessionId,
                osInfo: data.value.os,
            });
            this.getScreenWindowSize();
        })
    }

    getScreenWindowSize() {
        var window_size_path = 'session/' + this.state.sessionId + '/window/size';
        HTTP.fget(window_size_path, (data) => {
            console.log('window_size', data.value);
            if (data.value == "Session does not exist") {
                console.log('Session does not exist, refetch session')
                    // this.setState({
                    //   sessionId: data.sessionId
                    // })
                this.statusCheck();
            } else {
                console.log('Got window size')
                this.setState({
                    windowSize: data.value
                })
            }

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
        console.log('i', i);
        HTTP.post(HOMESCREEN, (data) => {
            console.log(data);
        });
        this.screenRefresh();
    }

    unlockSwipe(i) {
        console.log('unlockswipe', i);
        var screen_size = this.state.windowSize;
        if (parseInt(this.state.osInfo.version.replace(/\./gi, '')) >= 1000) {
            this.homeClick();
            var sleep_fetchScreenshot = new Promise((resolve, reject) => {
                setTimeout(resolve, 1000, "one");
            });

            Promise.all([sleep_fetchScreenshot]).then(values => {
                this.homeClick();
            });
        } else {
            this.homeClick();
            var x = screen_size.width;
            var y = screen_size.height;
            var swipe_path = 'session/' + this.state.sessionId + SWIPE;
            console.log(JSON.stringify({ fromX: 0.22 * x, toX: 0.86 * x, fromY: 0.86 * y, toY: 0.86 * y, duration: 0 }));
            HTTP.fpost(swipe_path, JSON.stringify({ fromX: 50, toX: 0.8 * x, fromY: 0.9 * y, toY: 0.9 * y, duration: 0 }), (data) => {
                console.log(data);
            });
        }

        this.screenRefresh();
        var sleep_fetchScreenshot = new Promise((resolve, reject) => {
            setTimeout(resolve, 3000, "one");
        });
        Promise.all([sleep_fetchScreenshot]).then(values => {
            this.unlockWithPasscode();
        });

    }


    unlockWithPasscode() {
        var passcode = this.state.unlockCode;
        var find_element_path = 'session/' + this.state.sessionId + '/element';
        for (var i = 0; i < passcode.length; i++) {
            console.log('passcode', passcode[i]);
            HTTP.fpost(find_element_path, JSON.stringify({ using: 'link text', value: 'label=' + passcode[i] }), (data) => {
                console.log(data);
                var elementId = data.value.ELEMENT;
                var click_element_path = find_element_path + '/' + elementId + '/click';
                HTTP.fpost(click_element_path, (data) => {
                    console.log(data);
                });
            });
        }

        var sleep_fetchScreenshot = new Promise((resolve, reject) => {
            setTimeout(resolve, 5000, "one");
        });
        Promise.all([sleep_fetchScreenshot]).then(values => {
            this.screenRefresh();
        });

    }

    refreshAll() {
        if (this.props.onFetchedChange != false) {
            this.props.onFetchedChange(false);
        }
    }

    screenRefresh() {
        var sleep_fetchScreenshot = new Promise((resolve, reject) => {
            setTimeout(resolve, 2000, "one");
        });

        Promise.all([sleep_fetchScreenshot]).then(values => {
            this.props.screenRefresh();
        });
    }

    updateScreenshotScaleValue(e) {
        this.props.changeScreenshotScale(e);
    }

    updateUnlockCode(e) {
        this.setState({
            unlockCode: e.currentTarget.value,
        })
    }

    render() {
      return (
        <div id="screen" className="section first">
          <div className="section-caption">
            Screen
          </div>
          <div>
            <Button onClick={(ev) => {this.home(ev); }} >
              Home
            </Button>
            <Button onClick={this.props.refreshApp} >
              Refresh
            </Button>
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
            <div>
            Screenshot scale:
              <input className="screen-scale"
                placeholder="90" 
                value={this.state.screenshotScaleValue} 
                onChange={this.updateScreenshotScaleValue.bind(this)}/>
            %
            </div>
            <button className="screen-refresh-button"
              onClick={this.screenRefresh.bind(this)}>
            Refresh
            </button>
            <div>
            Passcode:
              <input className="unlock-code"
                placeholder="0000" 
                value={this.state.unlockCode}
                onChange={this.updateUnlockCode.bind(this)}/>
              <button className="unlock-swipe-button"
                onClick={this.unlockSwipe.bind(this)}>
              Unlock Swipe
              </button>
            </div>
          </div>
        </div>
      );
    }

    gestureRecognizer() {
        if (!this._gestureRecognizer) {
            this._gestureRecognizer = new GestureRecognizer({
                onClick: (ev) => {
                    this.onScreenShotClick(ev);
                },
                onDrag: (params) => {
                    this.onScreenShotDrag(params);
                },
            });
        }
        return this._gestureRecognizer;
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
        var tap_on_path = 'session/' + this.state.sessionId + '/wda/tap/nil';
        HTTP.fpost(tap_on_path, JSON.stringify({ x: realX, y: realY }), (data) => {
            console.log(data);
        });
        console.log('props', this.props);
        this.screenRefresh();
    }

    onScreenShotDrag(params) {
        var fromX = params.origin.x - document.getElementById('screenshot').offsetLeft;
        var fromY = params.origin.y - document.getElementById('screenshot').offsetTop;
        var toX = params.end.x - document.getElementById('screenshot').offsetLeft;
        var toY = params.end.y - document.getElementById('screenshot').offsetTop;

        fromX = this.scaleCoord(fromX);
        fromY = this.scaleCoord(fromY);
        toX = this.scaleCoord(toX);
        toY = this.scaleCoord(toY);

        HTTP.get(
            'status', (status_result) => {
                var session_id = status_result.sessionId;
                HTTP.post(
                    'session/' + session_id + '/wda/element/0/dragfromtoforduration',
                    JSON.stringify({
                        'fromX': fromX,
                        'fromY': fromY,
                        'toX': toX,
                        'toY': toY,
                        'duration': params.duration,
                    }),
                    (tap_result) => {
                        this.props.refreshApp();
                    },
                );
            },
        );
    }

    scaleCoord(coord) {
        var screenshot = this.screenshot();
        var pxPtScale = screenshot.width / this.props.rootNode.rect.size.width;
        return coord / screenshot.scale / pxPtScale;
    }


    onMouseDown(ev) {
        this.gestureRecognizer().onMouseDown(ev);
    }

    onMouseMove(ev) {
        this.gestureRecognizer().onMouseMove(ev);
    }

    onMouseUp(ev) {
        this.gestureRecognizer().onMouseUp(ev);
    }

    home(ev) {
        HTTP.post(
            '/wda/homescreen',
            JSON.stringify({}),
            (result) => {
                this.props.refreshApp();
            },
        );
    }

    renderScreenshot() {
        return ( <img className = "screen-screenshot"
            src = { this.screenshot().source }
            style = { this.styleWithScreenSize() }
            onMouseDown = {
                (ev) => this.onMouseDown(ev)
            }
            onMouseMove = {
                (ev) => this.onMouseMove(ev)
            }
            onMouseUp = {
                (ev) => this.onMouseUp(ev)
            }
            draggable = "false"
            id = "screenshot" />
        ); 
    }

    renderHighlightedNode() {
        if (this.props.highlightedNode == null) {
            return null;
        }

        const rect = this.props.highlightedNode.rect;
        return ( <
            div className = "screen-highlighted-node"
            style = { this.styleForHighlightedNodeWithRect(rect) }
            />
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
            rect.origin.y < 0 || rect.origin.y * pxPtScale >= screenshot.height) {
            return {};
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
    screenshotScaleValue: React.PropTypes.object,
};

module.exports = Screen;