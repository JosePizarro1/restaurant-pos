import { useAtom } from "jotai";
import { appAlert, appState, closingEnforcementAtom } from "@/store/jotai.ts";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils.ts";
import { useDB } from "@/api/db/db.ts";
import {getClosingEnforcementState} from "@/lib/closing.guard.ts";
import {useTranslation} from "react-i18next";
import i18n from "@/lib/i18n.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export const MenuPersons = () => {
  const { t } = useTranslation('menu');
  const [state, setState] = useAtom(appState);
  const [enforcement] = useAtom(closingEnforcementAtom);
  const [, setAlert] = useAtom(appAlert);
  const [error, setError] = useState(false);
  const [first, setFirst] = useState(true);
  const db = useDB();

  const onCancel = async () => {
    if (state.table?.id) {
      try {
        await db.merge(state.table.id, {
          is_locked: false,
          locked_at: null,
          locked_by: null,
        });
      } catch (err) {
        console.error("Failed to unlock table on cancel:", err);
      }
    }

    setState(prev => ({
      ...prev,
      showFloor: true,
      showPersons: false,
      table: undefined,
      order: undefined,
      orders: [],
      cart: [],
      seats: [],
      persons: '1'
    }));
  };

  useEffect(() => {
    if (!enforcement.orderTakingBlocked || state.showFloor) {
      return;
    }

    setState(prev => ({
      ...prev,
      showFloor: true,
      showPersons: false,
      table: undefined,
      order: undefined,
      orders: [],
      cart: [],
      seats: [],
    }));

    if (enforcement.message) {
      setAlert(prev => ({
        ...prev,
        message: enforcement.message!,
        type: "warning",
        opened: true,
      }));
    }
  }, [enforcement.message, enforcement.orderTakingBlocked, setAlert, setState, state.showFloor]);

  const onKey = (key: string) => {
    setState(prev => ({
      ...prev,
      persons: first ? key : parseInt(prev.persons ? prev.persons + key : key).toString()
    }));

    setFirst(false);
  }

  const onOk = async () => {
    if( !state.persons || state.persons.trim() === '' || state.persons.trim() === '0' ) {
      setError(true);
      return;
    }

    try {
      const enforcementState = await getClosingEnforcementState(db);
      if (enforcementState.orderTakingBlocked) {
        setAlert(prev => ({
          ...prev,
          message: enforcementState.message ?? i18n.t('closing:orderTakingDisabled'),
          type: "warning",
          opened: true,
        }));
        setState(prev => ({
          ...prev,
          showFloor: true,
          showPersons: false,
          table: undefined,
          order: undefined,
          orders: [],
          cart: [],
        }));
        return;
      }
    } catch (error) {
      console.error("Failed to check closing enforcement:", error);
      return;
    }

    setState(prev => ({
      ...prev,
      showPersons: false,
    }));

    // if we have order set in the order directly
    if(state.order.id !== 'new'){
      await db.merge(state.order.id, {
        covers: parseInt(state?.persons)
      });
    }
  }

  useEffect(() => {
    if( error ) {
      setTimeout(() => setError(false), 400);
    }
  }, [error]);

  const btnClasses = 'size-[85px] sm:size-[100px] md:size-[120px] p-0 text-neutral-900 active:scale-[0.95] transition-all duration-75 bg-neutral-100 active:text-neutral-100 active:bg-neutral-900 rounded-full text-3xl';

  return (
    <div className="flex h-screen w-full justify-center items-center flex-col gap-5 bg-white relative">
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-6 left-6 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 rounded-xl font-semibold text-base flex items-center gap-2 border shadow-sm pressable transition-all cursor-pointer"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        {t('modifiers.cancel', 'Volver al Mapa')}
      </button>

      {state.table && (
        <div className="text-lg font-bold text-neutral-600 bg-neutral-100 px-5 py-2 rounded-full border shadow-sm">
          {state.table.name}
        </div>
      )}

      <h3 className={
        cn("text-3xl font-bold text-neutral-800", error && 'login-error')
      }>{t('persons.chooseCount')}</h3>
      <div
        className="w-[380px] h-[75px] flex items-center justify-center text-3xl font-bold">{state.persons}</div>
      <div className="grid grid-cols-3 gap-3">
        <button type="button" onClick={() => onKey('1')}
                className={btnClasses}>1
        </button>
        <button type="button" onClick={() => onKey('2')}
                className={btnClasses}>2
        </button>
        <button type="button" onClick={() => onKey('3')}
                className={btnClasses}>3
        </button>
        <button type="button" onClick={() => onKey('4')}
                className={btnClasses}>4
        </button>
        <button type="button" onClick={() => onKey('5')}
                className={btnClasses}>5
        </button>
        <button type="button" onClick={() => onKey('6')}
                className={btnClasses}>6
        </button>
        <button type="button" onClick={() => onKey('7')}
                className={btnClasses}>7
        </button>
        <button type="button" onClick={() => onKey('8')}
                className={btnClasses}>8
        </button>
        <button type="button" onClick={() => onKey('9')}
                className={btnClasses}>9
        </button>
        <button type="button" onClick={() => setState(prev => ({
          ...prev,
          persons: undefined
        }))}
                className="size-[85px] sm:size-[100px] md:size-[120px] p-0 text-white active:scale-[0.95] transition-all duration-75 bg-danger-500 active:bg-danger-900 rounded-full text-3xl">C
        </button>
        <button type="button" onClick={() => onKey('0')}
                className={btnClasses}>0
        </button>
        <button type="button" onClick={onOk}
                className="size-[85px] sm:size-[100px] md:size-[120px] p-0 text-white active:scale-[0.95] transition-all duration-75 bg-success-500 active:bg-success-900 rounded-full text-3xl">OK
        </button>
      </div>
    </div>
  );
}
