#!/bin/bash

# Fix for Folly coroutines header issue in React Native 0.81.4 with new architecture
# This script patches the Expected.h file to disable coroutines support

set -e

echo "Applying Folly coroutines fix..."

# Find and patch the Expected.h file in ReactNativeDependencies
EXPECTED_H_PATH=$(find ios/Pods/Headers/Public/ReactNativeDependencies -name "Expected.h" 2>/dev/null | head -n 1)

if [ -n "$EXPECTED_H_PATH" ] && [ -f "$EXPECTED_H_PATH" ]; then
  echo "Found Expected.h at: $EXPECTED_H_PATH"
  
  # Check if already patched
  if grep -q "#define FOLLY_HAS_COROUTINES 0" "$EXPECTED_H_PATH"; then
    echo "Expected.h already patched"
  else
    # Add definition before the problematic include
    sed -i.bak '/#if FOLLY_HAS_COROUTINES/i\
#ifndef FOLLY_HAS_COROUTINES\
#define FOLLY_HAS_COROUTINES 0\
#endif\
' "$EXPECTED_H_PATH"
    
    # Also replace the include line with a comment and define
    sed -i.bak2 's/#include <folly\/coro\/Coroutine\.h>/\/\/ #include <folly\/coro\/Coroutine.h> \/\/ Disabled: not available in ReactNativeDependencies\n#ifndef FOLLY_HAS_COROUTINES\n#define FOLLY_HAS_COROUTINES 0\n#endif/' "$EXPECTED_H_PATH"
    
    echo "Patched Expected.h file"
  fi
else
  echo "Expected.h not found yet (may be extracted during pod install)"
  # Ensure Podfile has the fix
  if [ -f "ios/Podfile" ]; then
    if ! grep -q "FOLLY_HAS_COROUTINES=0" ios/Podfile; then
      echo "Adding Folly fix to Podfile post_install hook..."
      ruby -i.bak -e "
        podfile = File.read('ios/Podfile')
        if podfile.include?('post_install do')
          podfile.gsub!(/(post_install do \|installer\|.*?react_native_post_install.*?\n)/m, \"\\1    \n    # Fix for Folly coroutines header issue\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |config|\n        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['\$(inherited)']\n        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'\n        config.build_settings['OTHER_CPLUSPLUSFLAGS'] ||= ['\$(inherited)']\n        config.build_settings['OTHER_CPLUSPLUSFLAGS'] << '-DFOLLY_HAS_COROUTINES=0'\n      end\n    end\n    \n\")
          File.write('ios/Podfile', podfile)
          puts 'Added Folly fix to Podfile'
        end
      "
    else
      echo "Podfile already contains Folly fix"
    fi
  fi
fi

