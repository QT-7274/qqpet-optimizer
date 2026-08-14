#include <ApplicationServices/ApplicationServices.h>
#include <objc/message.h>
#include <objc/runtime.h>
#include <stdio.h>
#include <string.h>

static void nsCursorSetHidden(int hide) {
  Class cls = objc_getClass("NSCursor");
  if (!cls) return;
  SEL sel = sel_registerName(hide ? "hide" : "unhide");
  if (!sel) return;
  ((void (*)(Class, SEL))objc_msgSend)(cls, sel);
}

int main(void) {
  setvbuf(stdin, NULL, _IONBF, 0);
  setvbuf(stdout, NULL, _IONBF, 0);
  char buf[32];
  while (fgets(buf, sizeof buf, stdin)) {
    if (buf[0] == 'h') {
      CGDisplayHideCursor(kCGDirectMainDisplay);
      nsCursorSetHidden(1);
    } else if (buf[0] == 's') {
      nsCursorSetHidden(0);
      CGDisplayShowCursor(kCGDirectMainDisplay);
    } else if (buf[0] == 'b') {
      int down = CGEventSourceButtonState(
          kCGEventSourceStateHIDSystemState, kCGMouseButtonLeft);
      fputs(down ? "1\n" : "0\n", stdout);
      fflush(stdout);
    } else if (buf[0] == 'q') {
      break;
    }
  }
  nsCursorSetHidden(0);
  CGDisplayShowCursor(kCGDirectMainDisplay);
  return 0;
}
