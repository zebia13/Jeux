Shared commands needs
  admin :
    data {
      discordOwnerID : the discord ID of the owner of the bot to set default language of the bot
      premiumspreadsheet : the ID of the spreadsheet where we find the premium datas, in particular : an 'index' sheet with [guilds, users] and the names of the sheets where we find the datas
      languageSpreadSheetId : the ID of the basic language spreadsheet of the bot
    }
  donate :
    data {
      premiumspreadsheet : the ID of the spreadsheet where we find the premium datas, in particular : an 'index' sheet with [users, donators] and the names of the sheets where we find the datas
      paypalAmount : the default amount of paypal donation
      paypalCurrency : the default currency of paypal donation
      discordOwnerID : the ID of the creator of the bot to send a message when a donation is done
    }
  help :
    data {
      helpCategory : the core category is by default for shared modules, any other category should be referenced in an array
      privilegeCategory : the privilege category must contain a public category for open commands and a privilege category for 1rst level of restricted commands
    }
  reload :
    THERE MUST NOT BE A BOT COMMAND NAMED : 'tongue' / 'replies' / 'bot' / 'client'
    tongue & replies reload the talking part || bot & client reload the bot items

CHANGE THE PRIVILEGE PART OF CORE COMMANDS
