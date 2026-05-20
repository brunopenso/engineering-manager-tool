type HeaderIdentityActionProps = {
  email: string;
  isConfirmingLogout: boolean;
  onIdentityClick: () => void;
  onConfirmLogout: () => void;
  onCancelLogout: () => void;
};

export default function HeaderIdentityAction({
  email,
  isConfirmingLogout,
  onIdentityClick,
  onConfirmLogout,
  onCancelLogout,
}: HeaderIdentityActionProps) {
  return (
    <div>
      <button type="button" onClick={onIdentityClick}>
        {email}
      </button>
      {isConfirmingLogout ? (
        <div>
          <p>Do you want to log out?</p>
          <button type="button" onClick={onConfirmLogout}>
            Confirm logout
          </button>
          <button type="button" onClick={onCancelLogout}>
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
