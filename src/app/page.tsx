"use client";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import { translations } from '../i18n/translations';
import BananaVoucherABI from './BananaVoucherABI.json';
import USDD_CONTRACT_ABI from './USDD_ABI.json';
declare global {
	interface Window {
		ethereum?: any;  // 替代 any
	}
  }

const CONTRACT_ADDRESS = "0xD9e34d1ffCcB45F8028B8f914602C8CD630ce04b";
const USDD_CONTRACT_ADDRESS = '0xE29d93aCc7a860756253fC849b51C76E1fe1aE18';
type VoucherType = 'cup' | 'condom' | 'vibrator';
const vouchers = [
	{
		type: 'cup' as VoucherType,  // 改为小写，与翻译文件对应
		name: "香蕉飞机杯",
		price: "5 USDD",
		image: "/banana-cup.png",
		description: "独特设计的香蕉形状，带来不一样的体验"
	},
	{
		type: "condom" as VoucherType,  // 改为小写，与翻译文件对应
		name: "香蕉避孕套",
		price: "8.85 USDD",
		image: "/banana-condom.png",
		description: "安全又有趣的香蕉避孕套"
	},
	{
		type: "vibrator" as VoucherType,  // 改为小写，与翻译文件对应
		name: "香蕉震动棒",
		price: "61.41 USDD",
		image: "/banana-vibrator.png",
		description: "高级震动棒，让快感更上一层楼"
	}
  ];

export default function Home() {
	const [account, setAccount] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [message, setMessage] = useState<string>('');
	const [balances, setBalances] = useState<{[key: string]: number}>({});
	const [lang, setLang] = useState<'zh-TW' | 'zh-CN' | 'en'>('zh-TW');

  // 连接钱包
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("连接钱包失败:", error);
      }
    } else {
      alert('请安装 MetaMask!');
    }
  };

	const approveUSDD = async (amount: bigint) => {
		const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
		const usddContract = new ethers.Contract(USDD_CONTRACT_ADDRESS, USDD_CONTRACT_ABI, signer);
		const tx = await usddContract.approve(CONTRACT_ADDRESS, amount);
		await tx.wait(); // 等待交易确认
	};
  // 铸造代金券
  const mintVoucher = async (voucherType: number) => {
    if (!account) {
      alert('请先连接钱包!');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BananaVoucherABI, signer);
			const usddContract = new ethers.Contract(USDD_CONTRACT_ADDRESS, USDD_CONTRACT_ABI, signer);
			// 获取代金券的价格
			const price = await contract.voucherPrices(voucherType);
			console.log(typeof(price))

			// 检查用户的 USDD 授权
			const allowance = await usddContract.allowance(account, CONTRACT_ADDRESS);
			console.log(allowance)
			// 确保 allowance 是 BigNumber
			//const priceBigNumber = ethers.BigNumber.from(price.toString());

			if (allowance < price) {
					await approveUSDD(price); // 授权 USDD
			}

			// 铸造代金券
			const tx = await contract.mintVoucher(voucherType);
			setMessage('交易已提交，等待确认...');
      
      await tx.wait();
      setMessage('代金券铸造成功！');
      updateBalances();
    } catch (error: unknown) {
      console.error("铸造失败:", error);
      setMessage(error instanceof Error ? error.message : '铸造失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新余额
  const updateBalances = useCallback(async () => {
	if (!account) return;
  
	try {
	  const provider = new ethers.BrowserProvider(window.ethereum);
	  const contract = new ethers.Contract(CONTRACT_ADDRESS, BananaVoucherABI, provider);
  
	  const newBalances: {[key: string]: number} = {};
	  for (let i = 0; i < vouchers.length; i++) {
		const balance = await contract.balanceOf(account);
		newBalances[vouchers[i].type] = Number(balance);
	  }
	  setBalances(newBalances);
	} catch (error) {
	  console.error("获取余额失败:", error);
	}
  }, [account]); // 只依赖 account

  useEffect(() => {
	if (account) {
	  updateBalances();
	}
  }, [account, updateBalances]);

  return (
    <div 
      className="min-h-screen bg-repeat"
      style={{ backgroundImage: 'url("/background.png")' }}
    >
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-70">
            <div className="flex-1">
              {/* 左侧空白区域用于平衡布局 */}
            </div>
            
            {/* Logo居中显示 */}
            <div className="flex-1 flex justify-center">
              <a 
                href="https://justinfun.shop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={70}
                  height={20}
                  className="object-contain"
                />
              </a>
            </div>
            
            {/* 右侧按钮组 */}
            <div className="flex-1 flex justify-end items-center space-x-2 sm:space-x-4">
              {/* 语言选择器 */}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'zh-TW' | 'zh-CN' | 'en')}
                className="bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="zh-TW">繁體中文</option>
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>

              {/* 连接钱包按钮 */}
              <button
                onClick={connectWallet}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 sm:py-2 px-2 sm:px-4 rounded-full text-xs sm:text-base whitespace-nowrap transition duration-300"
              >
                {account ? `${account.slice(0,6)}...${account.slice(-4)}` : translations[lang].connect}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vouchers.map((voucher, index) => (
            <div key={voucher.type} className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
              <div className="relative h-72">
                <Image
                  src={voucher.image}
				  alt={translations[lang][voucher.type].name}
				  fill
				  style={{ objectFit: 'cover' }}
				/>
			  </div>
			  <div className="p-6">
				<h3 className="text-xl font-bold text-gray-900 mb-2">
				  {translations[lang][voucher.type].name}
				</h3>
				<p className="text-gray-600 mb-4">
				  {translations[lang][voucher.type].description}
				</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 font-bold">{voucher.price}</span>
                  <button
                    onClick={() => mintVoucher(index)}
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 transition duration-300"
                  >
                    {loading ? translations[lang].processing : translations[lang].mint}
                  </button>
                </div>
                {balances[voucher.type] > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    {translations[lang].balance}: {balances[voucher.type]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}