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
import Screen from 'js/screen';
import ScreenshotFactory from 'js/screenshot_factory';
import Tree from 'js/tree';
import TreeNode from 'js/tree_node';
import TreeContext from 'js/tree_context';
import Inspector from 'js/inspector';


require('css/app.css')

const SCREENSHOT_ENDPOINT = 'screenshot';
const TREE_ENDPOINT = 'source';
const ORIENTATION_ENDPOINT = 'orientation';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      screenshotScaleValue: 1.0,
    };
  }

  componentDidMount() {
    this.fetchScreenshot();
    this.fetchTree();
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
      HTTP.get(SCREENSHOT_ENDPOINT + '?scale=' + this.state.screenshotScaleValue, (base64EncodedImage) => {
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
    HTTP.post(TREE_ENDPOINT, JSON.stringify({accessible: false, visible: true}), (treeInfo) => {
      this.setState({
        rootNode: TreeNode.buildNode(treeInfo.tree, new TreeContext()),
      });
    });
  }

  fetchFullTree() {
    console.log('Fetching full Tree');
    HTTP.post(TREE_ENDPOINT, JSON.stringify({accessible: false}), (treeInfo) => {
      this.setState({
        rootNode: TreeNode.buildNode(treeInfo.tree, new TreeContext()),
      });
    });
  }

  refreshClick(){
    if (!this.state.fetched) {
      this.fetchScreenshot();
      this.fetchTree();  
    }
  }

  render() {
    return (
      <div id="app">
        <Screen
          screenRefresh={this.fetchScreenshot.bind(this)}
          changeScreenshotScale={this.updateScreenshotScaleValue.bind(this)}
          data={this.state.data} 
          highlightedNode={this.state.highlightedNode}
          screenshot={this.state.screenshot}
          rootNode={this.state.rootNode} />
  			<Tree
          treeRefresh={this.fetchTree.bind(this)}
          fullTreeRefresh={this.fetchFullTree.bind(this)}
          onHighlightedNodeChange={(node) => {
            this.setState({
              highlightedNode: node,
            });
          }}
          onSelectedNodeChange={(node) => {
            this.setState({
              selectedNode: node,
            });
          }}
          rootNode={this.state.rootNode}
          selectedNode={this.state.selectedNode} />
  			<Inspector selectedNode={this.state.selectedNode} />
  		</div>
    );
  }
}

React.render(<App />, document.body);
