{
  "targets": [
    {
      "target_name": "bucketslib",
      "conditions": [
        ['OS=="win"',
          {
            "sources": [
              "<!@(node -p \"require('fs').readdirSync('./csrc').map(f=>'csrc/'+f).join(' ')\")",
              "<(module_root_dir)/jstonimbinding.cpp",
            ],
          },
          {
            "sources": [
              "<(module_root_dir)/jstonimbinding.cpp",
            ],
            "link_settings": {
              "libraries": "<(module_root_dir)/clib/<(OS)/libbuckets.a",
            }
          }
        ]
      ],
      "include_dirs": [
          "<!@(node -p \"require('node-addon-api').include\")",
          "<(module_root_dir)/csrc",
          "<(module_root_dir)/inc",
      ],
      'dependencies': [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      # "link_settings": {
      #   "libraries": [
      #     "<(module_root_dir)/lib/libbuckets.a",
      #   ],
      # },
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      "msbuild_settings": {
        "Link": {
          "ImageHasSafeExceptionHandlers": "false"
        }
      },
      "conditions": [
        ['OS=="win"',
          {
            'cflags': [ "-m32" ],
            'ldflags': [ "-m elf_i386" ],
            'cflags_cc': [ "-fPIC -m32" ],
          },
        ]
      ],
      'msvs_settings': {
        'VCCLCompilerTool': {
          'ExceptionHandling': 1,
          # 'RuntimeLibrary': 0,
         },
        # "VCLinkerTool": {
        #   "LinkIncremental": 1,
        #   "AdditionalLibraryDirectories": [
        #     "<(module_root_dir)\\clib\\<(OS)",
        #     "<(module_root_dir)\\csrc",
        #     "<(module_root_dir)\\inc",
        #   ]
        # }
      },
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": ["bucketslib"],
      "copies": [
        {
          "files": ["<(PRODUCT_DIR)/bucketslib.node"],
          "destination": "<(module_root_dir)/lib/",
        }
      ]
    }
  ]
}