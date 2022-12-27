const fs = require('fs');
const path = require('path');

// Get the current working directory
const rootDir = process.cwd();

// Create an empty array to store the data from all the CSV files
let allData = [];

// Read all the directories in the root folder
fs.readdir(rootDir, (err, dirNames) => {
  if (err) {
    console.error(err);
    return;
  }

  // Filter out any hidden directories (e.g. '.git') and the './output' directory
  const nonHiddenDirNames = dirNames.filter(dirName => !dirName.startsWith('.') && dirName !== 'output');

  // Sort the directories by name, so that we process them in chronological order
  nonHiddenDirNames.sort((a, b) => a.localeCompare(b));

  // Create a counter to track the number of CSV files that have been processed
  let fileCount = 0;

  // Iterate over the directories
  nonHiddenDirNames.forEach(dirName => {
    // Read the CSV files in the current directory
    fs.readdir(path.join(rootDir, dirName), (err, fileNames) => {
      if (err) {
        console.error(err);
        return;
      }

      // Filter out any hidden files
      const nonHiddenFileNames = fileNames.filter(fileName => !fileName.startsWith('.'));

      // Sort the files by name, so that we process them in chronological order
      nonHiddenFileNames.sort((a, b) => a.localeCompare(b));

      // Iterate over the CSV files
      nonHiddenFileNames.forEach(fileName => {
        // Print a debug message
        console.log(`Processing file ${fileName} in ${dirName}`);

        // Read the contents of the CSV file
        fs.readFile(path.join(rootDir, dirName, fileName), 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          // Split the data by line breaks to get an array of rows
          const rows = data.split('\n');

          // Process the rows to remove the first column and convert the datetime values to UNIX time in milliseconds
          const processedRows = rows.map(row => {
            const columns = row.split(';');
            if (columns.length < 2) {
              return row;
            }
            const datetime = columns[1];
            const unixTime = new Date(datetime).getTime();
            return [unixTime, ...columns.slice(2)].join(';');
          });

          // Add the processed rows to the allData array
          allData = allData.concat(processedRows);

          // Increment the file counter
          fileCount++;

          // If all the CSV files have been processed, write the combined data to the './output/ALL.csv' file
          if (fileCount === nonHiddenFileNames.length) {
            // Check if the './output' directory exists
            fs.stat(path.join(rootDir, 'output'), (err, stat) => {
              if (err && err.code === 'ENOENT') {
                // The './output' directory does not exist, so create it
                fs.mkdir(path.join(rootDir, 'output'), err => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  // The './output' directory has been created, so write the combined data to the './output/ALL.csv' file
                  fs.writeFile(path.join(rootDir, 'output', 'ALL.csv'), allData.join('\n'), 'utf8', err => {
                    if (err) {
                      console.error(err);
                    } else {
                      console.log('Combined data written to ./output/ALL.csv');
                    }
                  });
                });
              } else if (err) {
                console.error(err);
              } else {
                // The './output' directory already exists, so write the combined data to the './output/ALL.csv' file
                fs.writeFile(path.join(rootDir, 'output', 'ALL.csv'), allData.join('\n'), 'utf8', err => {
                  if (err) {
                    console.error(err);
                  } else {
                    console.log('Combined data written to ./output/ALL.csv');
                  }
                });
              }
            });
          }
        });
      });
    });
  });
});
