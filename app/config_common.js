module.exports = function() {
  return {
    productName: 'Buckets',
    appId: "com.github.buckets.application",
    mac: {
      category: "public.app-category.finance",
      target: [
        "zip",
        "dmg"
      ]
    },
    dmg: {
      icon: "build/dmg.icns",
    },
    win: {
      rfc3161TimeStampServer: "http://sha256timestamp.ws.symantec.com/sha256/timestamp",
      target: ["nsis", "portable"],
    },
    nsis: {
      perMachine: true,
    },
    linux: {
      category: "Finance",
      target: [
        "tar.gz",
        "deb",
        "AppImage"
      ]
    },
    fileAssociations: [
      {
        ext: "buckets",
        role: "Editor",
        icon: "build/doc.icns"
      }
    ],
    publish: [
      {
        provider: "github",
        owner: "buckets",
        repo: "application"
      }
    ],
    files: [
      "!**/*.c",
      "!**/*.cpp",
      "!**/*.h",
      "!**/*.ts",
      "!**/*.tsx",
      "!**/*.test.js",
      "!*.sh",
      "!.dockerignore",
      "!.nyc_output",
      "!.taprc",
      "!buckets.sublime-*",
      "!coverage${/*}",
      "!dev${/*}",
      "!devdocs${/*}",
      "!mocha.opts",
      "!**/nakefile",
      "!**/*.nim",
      "!node_modules/buckets-core/node_modules/bucketslib/build",
      "!node_modules/buckets-core/node_modules/bucketslib/csrc",
      "!node_modules/buckets-core/node_modules/bucketslib/csrc32",
      "!node_modules/buckets-core/node_modules/bucketslib/csrc64",
      "!nodesrc${/*}",
      "!README.md",
      "!test${/*}",
      "!TODO",
      "!tsconfig.json",
      "!watchtest.js"
    ]
  }
}

// object { afterAllArtifactBuild?, afterPack?, afterSign?, apk?, appId?, appImage?, appx?, artifactBuildCompleted?, artifactBuildStarted?, artifactName?, asar?, asarUnpack?, beforeBuild?, buildDependenciesFromSource?, buildVersion?, compression?, copyright?, cscKeyPassword?, cscLink?, deb?, detectUpdateChannel?, directories?, dmg?, electronCompile?, electronDist?, electronDownload?, electronUpdaterCompatibility?, electronVersion?, extends?, extraFiles?, extraMetadata?, extraResources?, fileAssociations?, files?, forceCodeSigning?, framework?, freebsd?, generateUpdatesFilesForAllChannels?, icon?, includePdb?, launchUiVersion?, linux?, mac?, mas?, msi?, muonVersion?, nodeGypRebuild?, nodeVersion?, npmArgs?, npmRebuild?, npmSkipBuildFromSource?, nsis?, nsisWeb?, onNodeModuleFile?, p5p?, pacman?, pkg?, portable?, productName?, protocols?, protonNodeVersion?, publish?, readonly?, releaseInfo?, remoteBuild?, removePackageScripts?, rpm?, snap?, squirrelWindows?, target?, win? }