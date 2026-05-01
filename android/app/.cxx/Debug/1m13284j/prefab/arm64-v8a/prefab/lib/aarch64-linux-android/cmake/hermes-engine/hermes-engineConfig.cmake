if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/HP/.gradle/caches/8.10.2/transforms/99958776990dae9c13f6a0800a67f310/transformed/jetified-hermes-android-0.76.6-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/HP/.gradle/caches/8.10.2/transforms/99958776990dae9c13f6a0800a67f310/transformed/jetified-hermes-android-0.76.6-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

