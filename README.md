# AppLocker Intune Helper

A client-side helper to generate AppLocker `RuleCollection` XML for Microsoft Intune Custom OMA-URI profiles.

No backend. No upload. Everything runs locally in the browser.

## What It Does

- Paste an existing AppLocker `RuleCollection` XML.
- Add generic `FilePathRule` entries with generated GUIDs.
- Choose rule collection type: EXE, DLL, MSI, Script, or StoreApps.
- Choose Allow or Deny actions.
- Suggest the matching Intune AppLocker OMA-URI.
- Validate basic XML structure.
- Copy the final XML for Intune.
- Switch between Portuguese and English.

## Why

Managing AppLocker rules in Intune often means editing XML manually. That is slow, repetitive, and easy to break. This helper keeps the workflow simple for common path-based allow/deny rules.

## Use Locally

Open `index.html` in a browser.

## GitHub Pages

After pushing this repository to GitHub:

1. Go to `Settings`.
2. Open `Pages`.
3. Select `Deploy from branch`.
4. Use branch `main` and folder `/root`.

## Intune OMA-URI Example

For executable rules:

```text
./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/EXE/Policy
```

Use `String` as the data type and paste the full `RuleCollection` XML.

## User/Group SID Tips

- `S-1-1-0`: Everyone/Todos.
- `S-1-5-32-544`: Local Administrators.
- For an Active Directory group, get the SID with PowerShell:

```powershell
Get-ADGroup "Group Name" | Select-Object Name,SID
```

## Security Note

Path-based AppLocker allow rules are only safe when standard users cannot write to the allowed path. For example, if you allow `C:\LineOfBusiness\App\*`, make sure users have read/execute permissions only.

## License

MIT
