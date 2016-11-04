/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <XCTest/XCTest.h>

#import <WebDriverAgentLib/FBDebugLogDelegateDecorator.h>
#import <WebDriverAgentLib/FBConfiguration.h>
#import <WebDriverAgentLib/FBFailureProofTestCase.h>
#import <WebDriverAgentLib/FBWebServer.h>
#import <WebDriverAgentLib/XCTestCase.h>
#import "FBLogger.h"
#import "XCUIDevice+FBHelpers.h"

static NSString *const FBServerURLBeginMarker = @"ServerURLHere->";
static NSString *const FBServerURLEndMarker = @"<-ServerURLHere";

@interface UITestingUITests : FBFailureProofTestCase
@end

@implementation UITestingUITests


+ (void)setUp
{
  [FBDebugLogDelegateDecorator decorateXCTestLogger];
  [super setUp];
}

/**
 Given back ip address before run testRunner, fix for one of our device which doesn't show ip in logs 
 */
- (void)testIpAddress
{
 [FBLogger logFmt:@"%@http://%@:8100%@", FBServerURLBeginMarker, [XCUIDevice sharedDevice].fb_wifiIPAddress, FBServerURLEndMarker];
}

/**
 Never ending test used to start WebDriverAgent
 */
- (void)testRunner
{
  [FBConfiguration shouldShowFakeCollectionViewCells:YES];
  [[FBWebServer new] startServing];
}

@end
