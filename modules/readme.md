Shared modules needs
  api-paypal :
    data {
      separatorStart : special characters to note the start of a custom text that should be inserted
      separatorEnd : special characters to note the end of a custom text that should be inserted
      formatorStart : special characters to note the start of a special format in text
      formatorEnd : special characters to note the end of a special format in text
      gsheetkeys : the google credential
    }
  api-paypal :
    data {
      paypalId : the paypal ID of the account to get the money
    	paypalSecret : the paypal secret registered with the ID
    }
  replies :
    data {
      languagespreadsheet : the ID of the index of all registered languages and data about bot speaking module
    }
  tongue :
    data {
      defaultLanguage : default language
  		prefix : prefix of the bot
  		separatorStart : the separator for custom language part
  		separatorEnd : the separator for custom language part
  		discordOwnerID : the discord ID of the bot owner
  		languagespreadsheet : the ID of the index of all registered languages and data about bot speaking module
    }

},
