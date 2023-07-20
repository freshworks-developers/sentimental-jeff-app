app.initialized().then(client => {
  window.client = client;
  utils.set('sentimentField', { disabled: true });
  fillTicketFieldsOptions();
}, error => {
  console.error('Error: Failed to init the app.')
  console.error(error);
});

function fillTicketFieldsOptions() {
  let timeout;
  return new Promise(function (resolve, reject) {
    clearTimeout(timeout);
    timeout = setTimeout(async function () {
      try {
        const iparams = await client.iparams.get();
        const domain = utils.get('domainName') || iparams.domainName;
        const apiKey = utils.get('apiKey') || iparams.apiKey;
        if (domain && apiKey) {
          try {
            let result = await client.request.invokeTemplate("getTicketFields", {
              context: {
                domain: domain,
                encodedApiKey: btoa(apiKey + ':X')
              }
            });
            let ticketFields = JSON.parse(result.response);
            const customFields = ticketFields.filter(field => field.type === 'custom_text').map(filteredField => filteredField.name);
            if (customFields.length) {
              utils.set('sentimentField', { disabled: false });
              utils.set('sentimentField', { values: customFields });
            } else {
              console.info('Create a custom text field to update the sentiment result of the ticket to the ticket field.')
              client.interface.trigger("showNotify", {
                type: "info",
                message: "To store the sentiment result in a ticket field, create a custom text field to configure here."
              })
            }
            resolve();
          } catch (error) {
            console.error('error');
            console.error(error);
            reject("Error: Cannot fetch ticket fields.");
          }
        } else {
          console.info('skipped due to empty domain or api key');
          resolve();
        }
      } catch (error) {
        console.error('Error: Cannot get installation parameters');
        console.error(error);
        reject('Error: Cannot get installation parameters');
      }
    }, 500);
  });
}
