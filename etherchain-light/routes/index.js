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
          var abi = JSON.parse("[{\"constant\":true,\"inputs\":[{\"name\":\"\",\"type\":\"address\"}],\"name\":\"confirmation\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"adderAddress\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"checkInfo\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"qrInfo\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"mainSum\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"valid\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"voteCount\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"sum\",\"type\":\"uint256\"}],\"name\":\"validate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"_qrInfo\",\"type\":\"string\"},{\"name\":\"_checkInfo\",\"type\":\"string\"},{\"name\":\"_adderAddress\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"Validate\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"}]");
          var contract = web3.eth.contract(abi).at(tx.to);
          var i = ++index;
          contract["qrInfo"](function (err, result) {
            tx.qrInfo = result;
            txs[i] = tx;
            count++;
            if (count === txCount) {
              res.render('index', {blocks: blocks, txs: txs, skip: skip});
            }
          });
        }
      );
    });

  });
});

module.exports = router;
