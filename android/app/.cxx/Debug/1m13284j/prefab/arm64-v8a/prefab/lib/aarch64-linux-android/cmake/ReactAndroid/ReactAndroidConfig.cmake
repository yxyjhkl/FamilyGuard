if(NOT TARGET ReactAndroid::hermestooling)
add_library(ReactAndroid::hermestooling SHARED IMPORTED)
set_target_properties(ReactAndroid::hermestooling PROPERTIES
    IMPORTED_LOCATION "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/hermestooling/libs/android.arm64-v8a/libhermestooling.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/hermestooling/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::jsctooling)
add_library(ReactAndroid::jsctooling SHARED IMPORTED)
set_target_properties(ReactAndroid::jsctooling PROPERTIES
    IMPORTED_LOCATION "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/jsctooling/libs/android.arm64-v8a/libjsctooling.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/jsctooling/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::jsi)
add_library(ReactAndroid::jsi SHARED IMPORTED)
set_target_properties(ReactAndroid::jsi PROPERTIES
    IMPORTED_LOCATION "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/jsi/libs/android.arm64-v8a/libjsi.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/jsi/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::reactnative)
add_library(ReactAndroid::reactnative SHARED IMPORTED)
set_target_properties(ReactAndroid::reactnative PROPERTIES
    IMPORTED_LOCATION "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/reactnative/libs/android.arm64-v8a/libreactnative.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/HP/.gradle/caches/8.10.2/transforms/33e911e6038e6715e6ff3a0e7e318a42/transformed/jetified-react-android-0.76.6-debug/prefab/modules/reactnative/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

