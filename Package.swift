// swift-tools-version:5.5

import PackageDescription

let package = Package(
    name: "GlobeM8",
    dependencies: [
        // Add any external dependencies here
    ],
    targets: [
        .executableTarget(
            name: "GlobeM8",
            dependencies: []
        ),
        .testTarget(
            name: "GlobeM8Tests",
            dependencies: ["GlobeM8"]),
    ]
)
