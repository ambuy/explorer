var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');


router.get('/:skip?', function (req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  console.log(req.params.skip);
  var skip = req.params.skip;
  if (!skip) {
    skip = 0;
  }
  async.waterfall([
    function (callback) {
      web3.eth.getBlock("latest", false, function (err, result) {
        callback(err, result);
      });
    }, function (lastBlock, callback) {
      var blocks = [];

      var blockCount = 10;
      if (lastBlock.number - skip >= lastBlock.number) {
        skip = 0
      }

      if (lastBlock.number - blockCount - skip < 0) {
        skip = lastBlock.number - blockCount;
      }

      async.times(blockCount, function (n, next) {
        web3.eth.getBlock(lastBlock.number - n - skip, true, function (err, block) {
          next(err, block);
        });
      }, function (err, blocks) {
        callback(err, blocks);
      });
    }
  ], function (err, blocks) {
    if (err) {
      return next(err);
    }

    var txs = [];
    var count = 0;
    var index = -1;
    var txCount = 0;
    blocks.forEach(function (block) {
      txCount += block.transactions.length;
    });
    if (txCount == 0) {
      res.render('index', {blocks: blocks, txs: txs, skip: skip});
    }
    blocks.forEach(function (block) {
        block.transactions.forEach(function (tx) {
          var i = ++index;
          txs[i] = tx;
          var namebleAbi = web3.eth.contract(JSON.parse("[{\"constant\":true,\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"version\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"_name\",\"type\":\"string\"},{\"name\":\"_version\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"}]")).at(tx.to);
          namebleAbi["name"](function(err, result) {
            count++;
            if (result != null) {
              tx.name = result;
            }
            if (count === txCount) {
              res.render('index', {blocks: blocks, txs: txs, skip: skip});
            }
          });

        });
      }
    );
  });
});

module.exports = router;
