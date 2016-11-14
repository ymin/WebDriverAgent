/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "FBScreenshotCommands.h"
#import "FBRoute.h"
#import "FBRouteRequest.h"
#import "XCUIDevice+FBHelpers.h"

@implementation FBScreenshotCommands

#pragma mark - <FBCommandHandler>

+ (NSArray *)routes
{
  return
  @[
    [[FBRoute GET:@"/screenshot"].withoutSession respondWithTarget:self action:@selector(handleGetScreenshot:)],
    [[FBRoute GET:@"/screenshot"] respondWithTarget:self action:@selector(handleGetScreenshot:)],
  ];
}


#pragma mark - Commands

+ (id<FBResponsePayload>)handleGetScreenshot:(FBRouteRequest *)request
{
  NSString *scale = request.parameters[@"scale"];
  NSScanner *scanner = [NSScanner scannerWithString:scale];
  float scale_value;
  BOOL success = [scanner scanFloat:&scale_value];
  NSString *screenshot;
  if (!success) {
    screenshot = [[XCUIDevice sharedDevice].fb_screenshot base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
  }
  else {
    screenshot = [[[XCUIDevice sharedDevice] fb_screenshot_small:scale_value] base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
  }
  return FBResponseWithObject(screenshot);
}

@end
