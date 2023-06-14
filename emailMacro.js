/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************
 * 
 * Macro Author:        Ephraim Kakumani
 *                      Customer Delivery Architect 
 *                      ekakuman@cisco.com
 *                      Cisco Systems
 * 
 * Version: 1-0-0
 * Released: 06/12/23
 ********************************************************/
 
import xapi from 'xapi';

const username ='';
const pass = '';

// Register the User Interface Extensions widget
xapi.Command.UserInterface.Extensions.Panel.Save({
  PanelId: 'report_issue'
}, `<Extensions>
      <Version>1.9</Version>
      <Panel>
        <Order>2</Order>
        <Type>Statusbar</Type>
        <Icon>Input</Icon>
        <Color>#FF9800</Color>
        <Name>Report Issue</Name>
        <ActivityType>Custom</ActivityType>
      </Panel>
    </Extensions>`);

// Listen for the Report_Issue panel and display initial prompt
xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
  if (event.PanelId === 'report_issue') {
    console.log('Report Issue Selected');

    // Check email input
    checkEmailInput();
  }
});

// Check the email
function checkEmailInput() {
  console.log('Email Panel Displayed');
  xapi.command("UserInterface Message TextInput Display", {
    Title: 'Contact Info',
    Text: 'Please enter your email to report the issue ',
    Placeholder: '<userid>@abc.com or <userid>@webex.abc.com',
    InputType: 'SingleLine',
    SubmitText: 'Submit',
    FeedbackId: 'email_id',
  }).catch((error) => {
    console.error(error);
  });
}

let invalidEmail = ''; // Variable to store the invalid email address

// Create Basic Auth Base64 token
function basicAuth(user, password) {
    return "Basic " + btoa(user + ":" + password);
}

function generateRandomNumberWithPrefix(prefix, digits) {
        const randomNumber = Math.floor(Math.random() * Math.pow(10, digits));
        const formattedNumber = String(randomNumber).padStart(digits, '0');
        return prefix + formattedNumber;
}

// Usage example
const prefix = 'INS';
const digits = 4;
let randomNumber = generateRandomNumberWithPrefix(prefix, digits);
console.log('Random number:', randomNumber);

// Listen for the email address input
xapi.event.on('UserInterface Message TextInput Response', (event) => {
  if (event.FeedbackId === 'email_id') {
    const emailAddress = event.Text;

    // Validate the suffix of the email address
    if (isValidEmailSuffix(emailAddress)) {
      // Send the email address info to Power Automate
      const url = 'https://hooks.us.webexconnect.io/events/XXXX';
      const body = JSON.stringify({ email: emailAddress, randomNumber: randomNumber});
      const Header = ['Content-Type: application/json',
      //'Authorization: ' + basicAuth(username, pass)
      ];
      console.log(body);

      xapi.Command.HttpClient.Post({ Url: url, Header, AllowInsecureHTTPS: 'True', ResultBody: 'PlainText' }, body)
      .then(res => {
        if(res.StatusCode == 200){
          console.log(res.StatusCode);
          xapi.command('UserInterface Message TextLine Display', { 
              Text: 'Email sent successfully: ' + randomNumber,    
              Duration: 5,     
          });
        }
      });
    } else {
      invalidEmail = emailAddress; // Store the invalid email address
      console.log('Invalid Email:'+ invalidEmail);
      clearEmailInput();
    }
  }
});

// Clear the email input text and return to the original window
function clearEmailInput() {
  xapi.command('UserInterface Message TextInput Clear', {
    FeedbackId: 'email_id',
  }).then(() => {
  xapi.command('UserInterface Message TextLine Display', {
      //Alternate Commands 'UserInterface Message Alert Display'
      //Alternate Commands 'UserInterface Message Prompt Display'

      //Title: 'Invalid Email Address', // Works with Alert Display
      Text: 'Please enter a valid email address.',
      Duration: 3, // Display for 3 seconds
    });
  }).then(() => {
    setTimeout(() => {
        checkEmailInput();
      }, 3000);
  }).catch((error) => {
    console.error(error);
  });
}

// Validate the suffix of the email address
function isValidEmailSuffix(emailAddress) {
  const validSuffixes = ['abc.com', 'webex.abc.com']; // Add your valid suffixes here

  const suffix = emailAddress.split('@')[1];
  return validSuffixes.includes(suffix);
}