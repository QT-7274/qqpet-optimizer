/*
 * In-process macOS cursor hide for Electron.
 * NSCursor.hide in a helper process does not affect Chromium.
 * CGCursorIsVisible is deprecated and must not gate hide (it stacks).
 * pet-cursor.CURSOR.3
 * pet-cursor.CURSOR.3-2
 */
#include <stdbool.h>
#include <stddef.h>
#include <ApplicationServices/ApplicationServices.h>
#include <CoreGraphics/CoreGraphics.h>
#include <objc/message.h>
#include <objc/runtime.h>

typedef struct napi_env__ *napi_env;
typedef struct napi_value__ *napi_value;
typedef struct napi_callback_info__ *napi_callback_info;
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
typedef struct {
  double width;
  double height;
} PetSize;
typedef struct {
  double x;
  double y;
} PetPoint;

extern int napi_create_function(napi_env, const char *, size_t, napi_callback, void *, napi_value *);
extern int napi_set_named_property(napi_env, napi_value, const char *, napi_value);
extern int napi_get_boolean(napi_env, bool, napi_value *);
extern int napi_get_undefined(napi_env, napi_value *);

static int stacked_hidden = 0;
static id blank_cursor = NULL;

static void nsCursorSetHidden(int hide) {
  Class cls = objc_getClass("NSCursor");
  if (!cls) return;
  SEL sel = sel_registerName(hide ? "hide" : "unhide");
  if (!sel) return;
  ((void (*)(Class, SEL))objc_msgSend)(cls, sel);
}

static id nsRetain(id obj) {
  if (!obj) return NULL;
  return ((id (*)(id, SEL))objc_msgSend)(obj, sel_registerName("retain"));
}

static id blankCursor(void) {
  if (blank_cursor) return blank_cursor;
  CGColorSpaceRef space = CGColorSpaceCreateDeviceRGB();
  if (!space) return NULL;
  CGContextRef ctx = CGBitmapContextCreate(
      NULL, 1, 1, 8, 4, space, kCGImageAlphaPremultipliedLast);
  CGColorSpaceRelease(space);
  if (!ctx) return NULL;
  CGImageRef cgImage = CGBitmapContextCreateImage(ctx);
  CGContextRelease(ctx);
  if (!cgImage) return NULL;
  Class NSImage = objc_getClass("NSImage");
  Class NSCursor = objc_getClass("NSCursor");
  if (!NSImage || !NSCursor) {
    CGImageRelease(cgImage);
    return NULL;
  }
  PetSize size = {1, 1};
  id image = ((id (*)(id, SEL, CGImageRef, PetSize))objc_msgSend)(
      ((id (*)(Class, SEL))objc_msgSend)(NSImage, sel_registerName("alloc")),
      sel_registerName("initWithCGImage:size:"),
      cgImage,
      size);
  CGImageRelease(cgImage);
  if (!image) return NULL;
  PetPoint hot = {0, 0};
  id cursor = ((id (*)(id, SEL, id, PetPoint))objc_msgSend)(
      ((id (*)(Class, SEL))objc_msgSend)(NSCursor, sel_registerName("alloc")),
      sel_registerName("initWithImage:hotSpot:"),
      image,
      hot);
  blank_cursor = nsRetain(cursor);
  return blank_cursor;
}

static void setCursor(id cursor) {
  if (!cursor) return;
  ((void (*)(id, SEL))objc_msgSend)(cursor, sel_registerName("set"));
}

static void setBlankCursor(void) {
  setCursor(blankCursor());
}

static void setArrowCursor(void) {
  Class cls = objc_getClass("NSCursor");
  if (!cls) return;
  id arrow = ((id (*)(Class, SEL))objc_msgSend)(cls, sel_registerName("arrowCursor"));
  setCursor(arrow);
}

static napi_value undefinedValue(napi_env env) {
  napi_value value = NULL;
  napi_get_undefined(env, &value);
  return value;
}

static napi_value HideIfVisible(napi_env env, napi_callback_info info) {
  (void)info;
  setBlankCursor();
  if (!stacked_hidden) {
    CGDisplayHideCursor(kCGDirectMainDisplay);
    nsCursorSetHidden(1);
    stacked_hidden = 1;
  }
  return undefinedValue(env);
}

static napi_value Show(napi_env env, napi_callback_info info) {
  (void)info;
  if (stacked_hidden) {
    nsCursorSetHidden(0);
    CGDisplayShowCursor(kCGDirectMainDisplay);
    stacked_hidden = 0;
  }
  setArrowCursor();
  return undefinedValue(env);
}

static napi_value IsPressed(napi_env env, napi_callback_info info) {
  (void)info;
  napi_value result = NULL;
  int down = CGEventSourceButtonState(
      kCGEventSourceStateHIDSystemState, kCGMouseButtonLeft);
  napi_get_boolean(env, down ? true : false, &result);
  return result;
}

__attribute__((visibility("default")))
napi_value napi_register_module_v1(napi_env env, napi_value exports) {
  napi_value hideFn = NULL;
  napi_value showFn = NULL;
  napi_value pressedFn = NULL;
  napi_create_function(env, "hideIfVisible", (size_t)-1, HideIfVisible, NULL, &hideFn);
  napi_create_function(env, "show", (size_t)-1, Show, NULL, &showFn);
  napi_create_function(env, "isPressed", (size_t)-1, IsPressed, NULL, &pressedFn);
  napi_set_named_property(env, exports, "hideIfVisible", hideFn);
  napi_set_named_property(env, exports, "show", showFn);
  napi_set_named_property(env, exports, "isPressed", pressedFn);
  return exports;
}
