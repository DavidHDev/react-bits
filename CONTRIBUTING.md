# Contributing to React Bits

Thank you for considering contributing to React Bits! I appreciate your interest in making this project better.

To ensure a smooth collaboration, please read the following guidelines before getting started.

## Issue Tracker

We use the GitHub issue tracker to keep track of bugs, feature requests, and other project-related discussions. Before starting to work on a new feature or bug fix, please check the issue tracker to see if there's an existing issue or discussion related to it. If not, feel free to create a new issue.

## Branch Naming

When creating branches for your contributions, please follow the following naming convention:

`feat/<feature-name>`

For example, if you are working on a feature related to adding a new component, your branch name could be `feat/fix-x-component`. This naming convention helps us to easily track and associate contributions with their respective features.

## Pull Requests

We welcome pull requests from everyone as long as they respect the quality standards of this project. To submit a pull request, please follow these steps:

1. Fork the repository and create a new branch based on the branch naming convention mentioned above.
2. Make your changes in the new branch.
3. Submit a pull request to the main repository's `main` branch.
4. Provide a clear and descriptive title for your pull request, along with a detailed description of the changes you have made, and screenshots/videos where possible.
5. For components updates, ensure that changes are reflected in all related files. Each component change must be updated in all 4 variants of that particular component.
6. Before you open a pull request, please make sure that your changes are tested locally, and everything looks good on desktop and mobile, also check the browser console for errors, and so on, so that we can keep this library at the highest quality possible. Run `npm run check:prop-docs` after changing defaults or prop tables; the production build also runs this check. It compares scalar component defaults across all four variants and their documentation. Run `npm run test:prop-docs` when editing the checker, and extend its parser for new declaration patterns instead of silently skipping them.
7. Any pull requests that fail to meet these requirements will be denied, so please make sure you respect them so that your work can go through.

## Note

New components from the community are currently not being accepted into the library, only component enhancements and bug fixes are open for contributions.

## Conclusion

I appreciate your interest in contributing! By following these guidelines, you can help us maintain a healthy and productive open-source community. I value your contributions and look forward to your pull requests!

If you have any questions or need further assistance, please don't hesitate to reach out to us through the issue tracker or other communication channels mentioned in the project's documentation.

Happy contributing!
