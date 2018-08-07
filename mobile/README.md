Reinstall deps:

    yarn

To run on ios:

    yarn run ios

To run on android:

    alias android_phone='cd "${ANDROID_HOME}/tools" && echo "logging to /tmp/android.log" && emulator -avd Nexus_5X_API_23_Mallow_ > /tmp/android.log 2>&1 &'
    android_phone
    yarn run android
