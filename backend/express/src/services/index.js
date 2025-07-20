exports.queueService = {
    sendTask: async (task) => {
        console.log('Queue task', task);
        // TODO: implement queue logic
    }
};

exports.generateCertificatePDF = require('./pdfService').generateCertificatePDF;
