/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */


import React from 'react';
import ReactDOM from 'react-dom';

import HTTP from 'js/http';
import Screen from 'js/screen';
import ScreenshotFactory from 'js/screenshot_factory';
import Tree from 'js/tree';
import TreeNode from 'js/tree_node';
import TreeContext from 'js/tree_context';
import Inspector from 'js/inspector';

var React = require('react'); /* importing react */
var ReactDOM = require('react-dom'); /* importing react-dom */

require('css/app.css');

const SCREENSHOT_ENDPOINT = 'screenshot';
const TREE_ENDPOINT = 'source?format=json';
const ORIENTATION_ENDPOINT = 'orientation';
const ACCESSIBLE_TREE_ENDPOINT = 'wda/accessibleSource'


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
            screenshotScaleValue: 90.0,
        };
    }

    refreshApp() {
        this.fetchScreenshot();
        this.fetchTree();
    }


    componentDidMount() {
        this.refreshApp();
    }

    updateScreenshotScaleValue(e) {
        console.log('scale_value', e.currentTarget.value);
        this.setState({
            screenshotScaleValue: e.currentTarget.value,
        })
    }

    fetchScreenshot() {
        console.log('Fetching Screenshot');
        HTTP.get(ORIENTATION_ENDPOINT, (orientation) => {
            orientation = orientation.value;
            HTTP.get(SCREENSHOT_ENDPOINT + '?scale=' + this.state.screenshotScaleValue, (base64EncodedImage) => {

                base64EncodedImage = base64EncodedImage.value;
                ScreenshotFactory.createScreenshot(orientation, base64EncodedImage, (screenshot) => {
                    this.setState({
                        screenshot: screenshot,
                        // fetched: true,
                    });
                });
            });
        });
    }

    fetchTree() {
        console.log('Fetching Tree');
        HTTP.get(TREE_ENDPOINT, (treeInfo) => {
            treeInfo = treeInfo.value;
            this.setState({
                rootNode: TreeNode.buildNode(treeInfo, new TreeContext()),
            });
        });
    }

    fetchFullTree() {
        console.log('Fetching accessible Tree');
        HTTP.get(ACCESSIBLE_TREE_ENDPOINT, (treeInfo) => {
            this.setState({
                rootNode: TreeNode.buildNode(treeInfo, new TreeContext()),
            });
        });
    }

    refreshClick() {
        if (!this.state.fetched) {
            this.fetchScreenshot();
            this.fetchTree();
        }
    }

    render() {
        return (
            <div id = "app">
            <Screen screenRefresh = { this.fetchScreenshot.bind(this) }
                changeScreenshotScale = { this.updateScreenshotScaleValue.bind(this) }
                data = { this.state.data }
                highlightedNode = { this.state.highlightedNode }
                screenshot = { this.state.screenshot }
                rootNode = { this.state.rootNode }/>
            <Tree treeRefresh = { this.fetchTree.bind(this) }
                fullTreeRefresh = { this.fetchFullTree.bind(this) }
                rootNode = { this.state.rootNode }
                refreshApp = {
                    () => { this.refreshApp(); }/>
            <Tree onHighlightedNodeChange = {
                (node) => {
                    this.setState({
                        highlightedNode: node,
                    });
                }
            }
            onSelectedNodeChange = {
                (node) => {
                    this.setState({
                        selectedNode: node,
                    });
                }
            }
            rootNode = { this.state.rootNode }
            selectedNode = { this.state.selectedNode }/>
            <Inspector selectedNode = { this.state.selectedNode }
            refreshApp = {
                () => { this.refreshApp(); }
            }/>
            </div >
        );
    }
}

ReactDOM.render(<App />, document.body);

