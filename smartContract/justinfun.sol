// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BananaVoucher is ERC721, Ownable {
    // USDD合约接口
    IERC20 public usddToken;
    
    // 代金券类型
    enum VoucherType { 
        BANANA_CUP,      // 香香蕉飞机杯
        BANANA_CONDOM,   // 蕉避孕套
        BANANA_VIBRATOR  // 香蕉震动棒
    }
    
    // 存储每个NFT的类型
    mapping(uint256 => VoucherType) public voucherTypes;
    
    // 存储每种代金券类型对应的URI
    mapping(VoucherType => string) private _voucherURIs;
    
    // 每种代金券的价格（以USDD为单位，精度为6位小数）
    mapping(VoucherType => uint256) public voucherPrices;
    
    // 每种代金券的最大供应量
    mapping(VoucherType => uint256) public maxSupply;
    
    // 每种代金券的当前供应量
    mapping(VoucherType => uint256) public currentSupply;
    
    // 代币ID计数器
    uint256 private _tokenIdCounter;

    // 兑换状态记录
    mapping(uint256 => bool) public isRedeemed;
    
    // 兑换事件
    event VoucherRedeemed(uint256 indexed tokenId, VoucherType voucherType, address redeemer);

    constructor(address _usddAddress) ERC721("Banana Voucher", "BNAV") Ownable(msg.sender) {
        usddToken = IERC20(_usddAddress);
        
        // 设置价格
        voucherPrices[VoucherType.BANANA_CUP] = 5000000;      // 5 USDD
        voucherPrices[VoucherType.BANANA_CONDOM] = 8850000;   // 8.85 USDD
        voucherPrices[VoucherType.BANANA_VIBRATOR] = 61410000; // 61.41 USDD
        
        // 设置供应量
        maxSupply[VoucherType.BANANA_CUP] = 2000;
        maxSupply[VoucherType.BANANA_CONDOM] = 1000;
        maxSupply[VoucherType.BANANA_VIBRATOR] = 500;

        // 设置metadata URI
        _voucherURIs[VoucherType.BANANA_CUP] = "https://ipfs.io/ipfs/bafkreibpg4v7rbeyhgf5shyuiz5egoo7j7iwejj4pk3vdfmfzcmnbcvnq4";
        _voucherURIs[VoucherType.BANANA_CONDOM] = "https://ipfs.io/ipfs/bafkreigzrd7yfz3ndd255x56elho7uc65hhnyjndsr35emdlji6ow6qshy";
        _voucherURIs[VoucherType.BANANA_VIBRATOR] = "https://ipfs.io/ipfs/bafkreidwwwcsholucybtni6t7hjhehxxzotqtlf622ohcthc37j2zdl7f4";

        // 为所有者铸造20%的代币用于空投
        uint256 airdropCup = (maxSupply[VoucherType.BANANA_CUP] * 20) / 100;        // 400
        uint256 airdropCondom = (maxSupply[VoucherType.BANANA_CONDOM] * 20) / 100;  // 200
        uint256 airdropVibrator = (maxSupply[VoucherType.BANANA_VIBRATOR] * 20) / 100; // 100

        // 铸造香香蕉飞机杯代金券
        for(uint256 i = 0; i < airdropCup; i++) {
            _safeMint(msg.sender, _tokenIdCounter);
            voucherTypes[_tokenIdCounter] = VoucherType.BANANA_CUP;
            currentSupply[VoucherType.BANANA_CUP]++;
            _tokenIdCounter++;
        }

        // 铸造蕉避孕套代金券
        for(uint256 i = 0; i < airdropCondom; i++) {
            _safeMint(msg.sender, _tokenIdCounter);
            voucherTypes[_tokenIdCounter] = VoucherType.BANANA_CONDOM;
            currentSupply[VoucherType.BANANA_CONDOM]++;
            _tokenIdCounter++;
        }

        // 铸造香蕉震动棒代金券
        for(uint256 i = 0; i < airdropVibrator; i++) {
            _safeMint(msg.sender, _tokenIdCounter);
            voucherTypes[_tokenIdCounter] = VoucherType.BANANA_VIBRATOR;
            currentSupply[VoucherType.BANANA_VIBRATOR]++;
            _tokenIdCounter++;
        }
    }

    function mintVoucher(VoucherType voucherType) public {
        require(currentSupply[voucherType] < maxSupply[voucherType], "Maximum supply reached");
        
        uint256 price = voucherPrices[voucherType];
        
        // 检查用户是否已经授权足够的USDD
        require(usddToken.allowance(msg.sender, address(this)) >= price, "Insufficient USDD authorisation");
        
        // 转移USDD
        require(usddToken.transferFrom(msg.sender, address(this), price), "Failed USDD transfer");
        
        // 铸造NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        voucherTypes[tokenId] = voucherType;
        currentSupply[voucherType]++;
    }

    // 设置代金券兑换状态（仅限管理员）
    function setVoucherRedeemed(uint256 tokenId, bool redeemed) public onlyOwner {
        require(ownerOf(tokenId) != address(0), "Voucher does not exist");
        isRedeemed[tokenId] = redeemed;
        if(redeemed) {
            emit VoucherRedeemed(tokenId, voucherTypes[tokenId], ownerOf(tokenId));
        }
    }

    // 检查代金券是否已兑换
    function isVoucherRedeemed(uint256 tokenId) public view returns (bool) {
        require(ownerOf(tokenId) != address(0), "Voucher does not exist");
        return isRedeemed[tokenId];
    }

    // 重写tokenURI函数
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Voucher does not exist");
        VoucherType voucherType = voucherTypes[tokenId];
        return _voucherURIs[voucherType];
    }

    // 允许所有者更新URI
    function setVoucherURI(VoucherType voucherType, string memory newURI) public onlyOwner {
        _voucherURIs[voucherType] = newURI;
    }

    // 提取USDD（仅限所有者）
    function withdrawUSDD() public onlyOwner {
        uint256 balance = usddToken.balanceOf(address(this));
        require(balance > 0, "No extractable USDD");
        require(usddToken.transfer(owner(), balance), "Failed USDD withdrawal");
    }
}