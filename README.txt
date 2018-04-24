To download from the git :

Make sure that git is installed on your system by running "git -version" or "git --version" on a command prompt.

Run these commands:

mkdir "nameOfTheDirectoryYouWish"
cd "nameOfTheDirectoryYouWish"
git init
git remote add jira "the repository address on Jira"
git pull jira master (your password will be asked)

Once you have downloaded the sources from the git repository :

Make sure Node.js and so npm are installed on your computer by running "npm -v" in a command prompt.

If they are not, just search node.js on google and take the official site. Download the LTS version (you can't miss the download link)

Run "npm install -g cordova ionic"

Go to the project parent directory and :

-for a use on a smartphone

"ionic build ios/android"
"ionic run ios/android"

Pick ios or android following your smartphone's OS.

-If you just wish to emulate the app, run "ionic serve --lab"

I will later explain how to make the app run on a private blockchain.
