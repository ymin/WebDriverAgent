/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "FBDebugCommands.h"

#import "FBApplication.h"
#import "FBRouteRequest.h"
#import "FBSession.h"
#import "XCUIApplication+FBHelpers.h"
#import "XCUIElement+FBUtilities.h"
#import "FBXPath.h"

@implementation FBDebugCommands

#pragma mark - <FBCommandHandler>

+ (NSArray *)routes
{
  return
  @[
    [[FBRoute GET:@"/source"] respondWithTarget:self action:@selector(handleGetSourceCommand:)],
    [[FBRoute GET:@"/source"].withoutSession respondWithTarget:self action:@selector(handleGetSourceCommand:)],
    [[FBRoute GET:@"/wda/accessibleSource"] respondWithTarget:self action:@selector(handleGetAccessibleSourceCommand:)],
    [[FBRoute GET:@"/wda/accessibleSource"].withoutSession respondWithTarget:self action:@selector(handleGetAccessibleSourceCommand:)],
  ];
}


#pragma mark - Commands
+ (id<FBResponsePayload>)handleGetSourceCommand:(FBRouteRequest *)request
{
  FBApplication *application = request.session.application ?: [FBApplication fb_activeApplication];
  NSString *sourceType = request.parameters[@"format"];
  id result;
  const BOOL accessibleTreeType = [request.arguments[@"accessible"] boolValue];
  const BOOL visibleTreeType = [request.arguments[@"visible"] boolValue];
  if (!sourceType || [sourceType caseInsensitiveCompare:@"xml"] == NSOrderedSame) {
    [application fb_waitUntilSnapshotIsStable];
    result = [FBXPath xmlStringWithSnapshot:application.fb_lastSnapshot];
  } else if ([sourceType caseInsensitiveCompare:@"json"] == NSOrderedSame) {
    // Add accessibility filter to reduce result size, only works for json response
    //    result = application.fb_visibleTree;
    if (visibleTreeType) {
      return FBResponseWithObject(@{ @"tree": (accessibleTreeType ? application.fb_accessibilityTree : application.fb_visibleTree) ?: @{} } );
    } else {
      return FBResponseWithObject(@{ @"tree": (accessibleTreeType ? application.fb_accessibilityTree : application.fb_tree) ?: @{} } );
    };
  } else {
    return FBResponseWithStatus(
      FBCommandStatusUnsupported,
      [NSString stringWithFormat:@"Unknown source type '%@'. Only 'xml' and 'json' source types are supported.", sourceType]
    );
  }
  if (nil == result) {
    return FBResponseWithErrorFormat(@"Cannot get '%@' source of the current application", sourceType);
  }
  return FBResponseWithObject(result);
}

+ (id<FBResponsePayload>)handleGetAccessibleSourceCommand:(FBRouteRequest *)request
{
  FBApplication *application = request.session.application ?: [FBApplication fb_activeApplication];
  return FBResponseWithObject(application.fb_accessibilityTree ?: @{});
}

@end
