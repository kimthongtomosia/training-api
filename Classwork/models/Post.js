const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
         author: {
               type:mongoose.Schema.Types.ObjectId,
               ref: 'User',
               required: true
         },
         title: {
                  type: String,
                  required: true
         },
         content: {
                  type: String,
                  required: true
         },
         status: {
                  type: String,
                  enum: ['published', 'draft'],
                  default: 'draft'
         },
         createdAt: {
                  type: Date,
                  default: Date.now
         },
         updatedAt: {
                  type: Date,
                  default: Date.now
         }
});

module.exports = mongoose.model('Post', postSchema);