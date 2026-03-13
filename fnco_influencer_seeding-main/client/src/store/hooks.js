import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

// 타입이 지정된 Redux 훅들
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Redux 상태 변경 디버깅용 훅
export const useReduxLogger = (stateName) => {
    const state = useSelector((state) => state);

    useEffect(() => {}, [state, stateName]);

    return state;
};

// 특정 slice만 모니터링
export const useSliceLogger = (sliceName) => {
    const sliceState = useSelector((state) => state[sliceName]);

    useEffect(() => {}, [sliceState, sliceName]);

    return sliceState;
};
