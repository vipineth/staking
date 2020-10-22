import { useQuery, QueryConfig } from 'react-query';
import { SynthetixJS } from '@synthetixio/js';

import synthetix from 'lib/synthetix';

import QUERY_KEYS from 'constants/queryKeys';
import { useRecoilValue } from 'recoil';
import { isWalletConnectedState, networkState, walletAddressState } from 'store/wallet';

export type WalletDebtData = {
	targetCRatio: number;
	currentCRatio: number;
	transferable: number;
	debtBalance: number;
};

const useGetDebtDataQuery = (options?: QueryConfig<WalletDebtData>) => {
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const network = useRecoilValue(networkState);
	return useQuery<WalletDebtData>(
		QUERY_KEYS.Debt.WalletDebtData(walletAddress ?? '', network?.id!),
		async () => {
			const {
				contracts: { SystemSettings, Synthetix, SynthetixState },
				utils,
			} = synthetix.js as SynthetixJS;
			const IssuanceRatioContract = network?.id === 5 ? SystemSettings : SynthetixState;
			const result = await Promise.all([
				IssuanceRatioContract.issuanceRatio(),
				Synthetix.collateralisationRatio(walletAddress),
				Synthetix.transferableSynthetix(walletAddress),
				Synthetix.debtBalanceOf(walletAddress, utils.formatBytes32String('sUSD')),
			]);
			const [targetCRatio, currentCRatio, transferable, debtBalance] = result.map((item) =>
				Number(utils.formatEther(item))
			);
			return {
				targetCRatio,
				currentCRatio,
				transferable,
				debtBalance,
			};
		},
		{
			enabled: synthetix.js && isWalletConnected,
			...options,
		}
	);
};

export default useGetDebtDataQuery;