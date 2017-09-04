/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "XCUIDevice+FBHelpers.h"

#import <arpa/inet.h>
#import <ifaddrs.h>
#include <notify.h>

#import "FBSpringboardApplication.h"

#import "FBMacros.h"
#import "XCAXClient_iOS.h"

static const NSTimeInterval FBHomeButtonCoolOffTime = 1.;

@implementation XCUIDevice (FBHelpers)

- (BOOL)fb_goToHomescreenWithError:(NSError **)error
{
  [self pressButton:XCUIDeviceButtonHome];
  // This is terrible workaround to the fact that pressButton:XCUIDeviceButtonHome is not a synchronous action.
  // On 9.2 some first queries  will trigger additional "go to home" event
  // So if we don't wait here it will be interpreted as double home button gesture and go to application switcher instead.
  // On 9.3 pressButton:XCUIDeviceButtonHome can be slightly delayed.
  // Causing waitUntilApplicationBoardIsVisible not to work properly in some edge cases e.g. like starting session right after this call, while being on home screen
  [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:FBHomeButtonCoolOffTime]];
  if (![[FBSpringboardApplication fb_springboard] fb_waitUntilApplicationBoardIsVisible:error]) {
    return NO;
  }
  return YES;
}

- (BOOL)fb_doubleTapHomescreenWithError:(NSError **)error
{
  [self pressButton:XCUIDeviceButtonHome];
  [self pressButton:XCUIDeviceButtonHome];
//  // This is terrible workaround to the fact that pressButton:XCUIDeviceButtonHome is not a synchronous action.
//  // On 9.2 some first queries  will trigger additional "go to home" event
//  // So if we don't wait here it will be interpreted as double home button gesture and go to application switcher instead.
//  // On 9.3 pressButton:XCUIDeviceButtonHome can be slightly delayed.
//  // Causing waitUntilApplicationBoardIsVisible not to work properly in some edge cases e.g. like starting session right after this call, while being on home screen
//  [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:FBHomeButtonCoolOffTime]];
//  if (![[FBSpringboardApplication fb_springboard] fb_waitUntilApplicationBoardIsVisible:error]) {
//    return NO;
//  }
  return YES;
}

- (NSData *)fb_screenshot_small:(float)scale_value
{
  NSData *data =[[XCAXClient_iOS sharedClient] screenshotData];
  UIImage *image = [UIImage imageWithData:data];
  CGFloat actualHeight = image.size.height;
  CGFloat actualWidth = image.size.width;
  float maxHeight = 600.0;
  float maxWidth = 1200.0;
  CGFloat imgRatio = actualWidth/actualHeight;
  float maxRatio = maxWidth/maxHeight;
  float compressionQuality = scale_value/100; //percentage of compression
  if (actualHeight > maxHeight || actualWidth > maxWidth){
    if(imgRatio < maxRatio){ //adjust width according to maxHeight
      imgRatio = maxHeight / actualHeight;
      actualWidth = imgRatio * actualWidth;
      actualHeight = maxHeight;
    }
    else if(imgRatio > maxRatio){ //adjust height according to maxWidth
      imgRatio = maxWidth / actualWidth;
      actualHeight = imgRatio * actualHeight;
      actualWidth = maxWidth;
    }
    else{
      actualHeight = maxHeight; actualWidth = maxWidth;
    }
  }
  CGRect rect = CGRectMake(0.0, 0.0, actualWidth, actualHeight);
  UIGraphicsBeginImageContext(rect.size);
  [image drawInRect:rect]; UIImage *img = UIGraphicsGetImageFromCurrentImageContext();
  NSData *imageData = UIImageJPEGRepresentation(img, compressionQuality);
  UIGraphicsEndImageContext();
  return imageData;
}

- (NSData *)fb_screenshot
{
  id xcScreen = NSClassFromString(@"XCUIScreen");
  if (xcScreen) {
    return (NSData *)[xcScreen valueForKeyPath:@"mainScreen.screenshot.PNGRepresentation"];
  }
  return [[XCAXClient_iOS sharedClient] screenshotData];
}

- (BOOL)fb_fingerTouchShouldMatch:(BOOL)shouldMatch
{
  const char *name;
  if (shouldMatch) {
    name = "com.apple.BiometricKit_Sim.fingerTouch.match";
  } else {
    name = "com.apple.BiometricKit_Sim.fingerTouch.nomatch";
  }
  return notify_post(name) == NOTIFY_STATUS_OK;
}

- (NSString *)fb_wifiIPAddress
{
  struct ifaddrs *interfaces = NULL;
  struct ifaddrs *temp_addr = NULL;
  int success = getifaddrs(&interfaces);
  if (success != 0) {
    freeifaddrs(interfaces);
    return nil;
  }

  NSString *address = nil;
  temp_addr = interfaces;
  while(temp_addr != NULL) {
    if(temp_addr->ifa_addr->sa_family != AF_INET) {
      temp_addr = temp_addr->ifa_next;
      continue;
    }
    NSString *interfaceName = [NSString stringWithUTF8String:temp_addr->ifa_name];
    if(![interfaceName containsString:@"en"]) {
      temp_addr = temp_addr->ifa_next;
      continue;
    }
    address = [NSString stringWithUTF8String:inet_ntoa(((struct sockaddr_in *)temp_addr->ifa_addr)->sin_addr)];
    break;
  }
  freeifaddrs(interfaces);
  return address;
}

@end
