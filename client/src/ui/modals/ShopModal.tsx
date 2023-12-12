import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AccountState, setAccount, updateAccountAsync } from '../../redux/account/slice';
import api from '../../api';
import * as cosmetics from '../../game/cosmetics.json'

import './ShopModal.scss'
import { buyFormats } from '../../helpers';
let { skins } = cosmetics;

const basePath = '/assets/game/player/';

interface ShopModalProps {
  account: AccountState;
}

const ShopModal: React.FC<ShopModalProps> = ({ account }) => {
  const dispatch = useDispatch();
  const [skinStatus, setSkinStatus] = useState<{ [id: number]: string }>({});
  const [skinCounts, setSkinCounts] = useState<{ [id: number]: number }>({});

  const skinRefs = useRef<(HTMLImageElement | null)[]>(new Array(Object.keys(skins).length).fill(null));
  // const swordRefs = useRef<(HTMLImageElement | null)[]>(new Array(Object.keys(skins).length).fill(null));

  const assignRef = useCallback((element: HTMLImageElement, index: number) => {
    skinRefs.current[index] = element;
  }, []);
  function handleActionClick(id: number) {

    // If there is action already happening, don't do anything
    if (skinStatus[id]) return;

    const skinAction = account.skins.equipped === id ? null :
                      account.skins.owned.includes(id) ? 'Equipping...' : 'Buying...';

    if (skinAction) {
      setSkinStatus(prev => ({ ...prev, [id]: skinAction }));

      const apiPath = skinAction === 'Equipping...' ? '/equip/' : '/buy/';
      api.post(`${api.endpoint}/profile/cosmetics/skins${apiPath}${id}`, {
        token: account.token,
      }, (data) => {
        if (data.error) alert(data.error);
        dispatch(updateAccountAsync() as any);
        setSkinStatus(prev => ({ ...prev, [id]: '' }));
      });
    }
  }
  useEffect(() => {
    const handleMouseMove = (event: any) => {
      skinRefs.current.forEach((skinRef, index) => {


        // const swordRef = swordRefs.current[index];
        if (skinRef) {
          const skinRect = skinRef.getBoundingClientRect();
          // const swordRect = swordRef.getBoundingClientRect();

          const { left, top, width, height } = skinRect;
          const x = (left + width / 2);
          const y = (top + height / 2);
          let rad = Math.atan2(event.clientX - x, event.clientY - y);
          let degree = rad * (180 / Math.PI) * -1;

          skinRef.style.transform = `rotate(${degree}deg)`;

        //   const skinCenterX = skinRect.left + skinRect.width / 2;
        //   const skinCenterY = skinRect.top + skinRect.height / 2;

        //    rad = Math.atan2(event.clientX - skinCenterX, event.clientY - skinCenterY);
        //    degree = rad * (180 / Math.PI) * -1 + 140;

        //    const skinRadius = 300; // Adjust as needed
        // const leftOffset = 200; // Adjust as needed
        // const translateX = skinRadius * Math.sin(rad) - leftOffset;
        // const translateY = skinRadius * Math.cos(rad);

        // swordRef.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${degree}deg)`;
        }
      });
    };

    const modal = document.querySelector('.shop-modal');
    if (!modal) return;
    modal.addEventListener('mousemove', handleMouseMove);

    // Fetch skin counts
    api.get(`${api.endpoint}/profile/skins/buys`, (data) => {
      if (data.error) return alert('Error fetching skin cnts '+ data.error);
      setSkinCounts(data);
    });

    return () => {
      if (modal) {
        modal.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <div className="shop-modal">
      <h1 className='shop-title'>Shop</h1>
      {account?.isLoggedIn ? (
      <h1>Balance: {account.gems}<img className={'gem'} src='/assets/game/gem.png' alt='Gems' width={30} height={30} /></h1>
      ) : (
        <h1>Login or Signup to buy skins & cosmetics from the shop!</h1>
      )}
      <div className='skins'>
      {Object.values(skins).map((skin, index) => (
        <div className="skin-card" key={skin.name}>
          <h2 className="skin-name">{skin.displayName}</h2>
          <img
            src={basePath + skin.bodyFileName}
            alt={skin.name}
            ref={(el) => assignRef(el as HTMLImageElement, index)}
            width={150}
            height={150}
            className='skin-img'
          />
          <h4 className='skin-count'>{Object.keys(skinCounts ?? {}).length > 0 ? buyFormats(skinCounts[skin.id] ?? 0) : '...'} buys
          <br/>
          { skin.price > 0 ? (
            <>
          {skin.price} <img className={'gem'} src='/assets/game/gem.png' alt='Gems' width={30} height={30} />
          </> ) : (
            <>
            <p style={{marginLeft: 0, marginRight: 0, marginBottom: 0, marginTop: 7}}>Free</p>
            </>
          )}
          </h4>
          {account?.isLoggedIn && (
          <button className='buy-button' onClick={() => handleActionClick(skin.id)}>
            {skinStatus[skin.id] || (account.skins.equipped === skin.id ? 'Equipped' :
            account.skins.owned.includes(skin.id) ? 'Equip' : 'Buy')}
            </button>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

export default ShopModal;
