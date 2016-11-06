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
static NSString *const DeviceLanguageBeginMarker = @"DeviceLanguage->";
static NSString *const DeviceLanguageEndMarker = @"<-DeviceLanguage";
static NSString *const DeviceLocaleBeginMarker = @"DeviceLocale->";
static NSString *const DeviceLocaleEndMarker = @"<-DeviceLocale";

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
- (void)testDeviceInfo
{
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  [dateFormatter setDateFormat:@"yyyy-MM-dd HH:mm:ss.SSS"];
  NSString *dateString = [dateFormatter stringFromDate:[NSDate date]];
    
  NSString *str = [NSString stringWithFormat:@"%@ %@http://%@:8100%@", dateString, FBServerURLBeginMarker, [XCUIDevice sharedDevice].fb_wifiIPAddress, FBServerURLEndMarker];
    
  NSString *language = [NSString stringWithFormat: @"%@ %@%@%@", dateString, DeviceLanguageBeginMarker, [[[NSBundle mainBundle] preferredLocalizations] objectAtIndex:0], DeviceLanguageEndMarker];
    
  NSString *locale = [NSString stringWithFormat: @"%@ %@%@%@", dateString, DeviceLocaleBeginMarker, [[NSLocale currentLocale] localeIdentifier], DeviceLocaleEndMarker];
    
  printf("%s\n", [str UTF8String]);
  printf("%s\n", [language UTF8String]);
  printf("%s\n", [locale UTF8String]);
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
