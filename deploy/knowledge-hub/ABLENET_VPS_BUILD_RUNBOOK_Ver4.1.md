# BAI DEVELOPMENT HUB サーバー構築 実行手順書 Ver.4.1

**用途:** ABLENET L3 SSD / Ubuntu Server 24.04 LTS / BAI Knowledge Hub  
**管理ユーザー:** `baisound`  
**SSH:** PuTTY + PuTTYgen / Ed25519  
**方針:** 上から順に実行する。確認結果がNGなら、その場でSTOPして修正する。  
**重要:** VPS上で `compose.yaml` / `Caddyfile` / PostgreSQL Profile / Migration SQL / Runtime code を独自に作り直さない。

---

# 0. Ubuntu Server インストーラー

以下を選択してインストールする。

```text
Boot:
Try or Install Ubuntu Server

Network:
ens3
IPv4 = Manual

Subnet       58.191.43.0/24
Address      58.191.43.211
Gateway      58.191.43.1
Name servers 121.83.238.17,58.191.153.13

Storage:
/boot  約2GB ext4
/      残り   ext4
LVM    使用しない
LUKS   使用しない

Profile:
Your name          Baisound
Your server's name bai-knowledge-hub
Pick a username    baisound
Password           強力なLinuxパスワード

Ubuntu Pro:
Skip for now

SSH:
Install OpenSSH server                  ON
Allow password authentication over SSH ON（初回だけ）
Import SSH key                          OFF

Featured server snaps:
すべて未選択
```

インストール完了後、再起動する。

---

# 1. 初回SSHログイン

PuTTYから接続する。

```text
Host: 58.191.43.211
Port: 22
User: baisound
認証: インストール時に設定したLinuxパスワード
```

ログイン後に実行。

```bash
whoami
hostname
cat /etc/os-release
free -h
df -h
ip -br addr
ip route
```

期待値。

```text
whoami   = baisound
hostname = bai-knowledge-hub
Ubuntu   = 24.04 LTS
RAM      = 約8GB
```

sudo確認。

```bash
sudo whoami
```

期待値。

```text
root
```

違う場合はSTOP。

---

# 2. Ed25519公開鍵を登録

Windows側PuTTYgenで作成済みの、

```text
Public key for pasting into OpenSSH authorized_keys file
```

欄の `ssh-ed25519 ...` 1行を使用する。

VPSで実行。

```bash
install -d -m 700 ~/.ssh
vi ~/.ssh/authorized_keys
```

`vi`を開いたら `i` を押す。

PuTTYgenの `ssh-ed25519 ...` 1行を貼り付ける。

保存。

```text
Esc
:wq
Enter
```

権限設定。

```bash
chmod 600 ~/.ssh/authorized_keys
chown -R baisound:baisound ~/.ssh
ls -ld ~/.ssh
ls -l ~/.ssh/authorized_keys
```

期待値。

```text
~/.ssh          drwx------
authorized_keys -rw-------
```

---

# 3. PuTTYを.ppk認証へ変更

Windows側PuTTY。

```text
Session
Host Name: 58.191.43.211
Port: 22

Connection
  Data
    Auto-login username: baisound

Connection
  SSH
    Auth
      Credentials
        Private key file:
        C:\Users\<Windowsユーザー>\.ssh\baisound_ablenet.ppk
```

Saved Sessions。

```text
BAI-Knowledge-Hub-ABLENET
```

として保存。

**今のPassword SSH Sessionは閉じない。**

新しいPuTTYを起動し、保存したSessionから接続。

ログイン後。

```bash
whoami
sudo whoami
```

期待値。

```text
baisound
root
```

両方成功しなければSTOP。

---

# 4. SSHを公開鍵認証だけにする

設定ファイルを新規作成。

```bash
sudo vi /etc/ssh/sshd_config.d/00-baisound-hardening.conf
```

`i`を押し、以下をそのまま貼る。

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
PermitEmptyPasswords no
AllowUsers baisound

MaxAuthTries 3
LoginGraceTime 30

X11Forwarding no
AllowAgentForwarding no
PermitTunnel no

AllowTcpForwarding local
GatewayPorts no

LogLevel VERBOSE
```

保存。

```text
Esc
:wq
Enter
```

構文確認。

```bash
sudo sshd -t
```

**何も表示されなければOK。エラーが出たらSTOP。**

実際に有効になる設定を確認。

```bash
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|authenticationmethods|allowusers|maxauthtries|logingracetime|x11forwarding|allowagentforwarding|permittunnel|allowtcpforwarding|gatewayports|loglevel'
```

最低限、以下になっていること。

```text
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
pubkeyauthentication yes
authenticationmethods publickey
allowusers baisound
allowtcpforwarding local
gatewayports no
```

違う場合はSTOP。

SSH設定反映。

```bash
sudo systemctl reload ssh
```

---

# 5. SSH Hardeningの実接続確認

**既存PuTTYは閉じない。**

新しいPuTTYを起動。

```text
BAI-Knowledge-Hub-ABLENET
```

からEd25519 `.ppk`でログイン。

成功したら、

```bash
whoami
sudo whoami
```

を確認。

次に秘密鍵を指定していないPuTTY Sessionで、

```text
User: baisound
```

へ接続し、Passwordだけではログインできないことを確認。

次に、

```text
User: root
```

でSSH接続し、ログインできないことを確認。

最終状態。

```text
root SSH                    DENY
baisound + password         DENY
baisound + Ed25519 .ppk     ALLOW
baisound + .ppk + sudo      ALLOW
```

ここまで成功したら旧Password Sessionを閉じてよい。

---

# 6. Ubuntuを更新

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt autoremove --purge -y
```

再起動が必要か確認。

```bash
test -f /var/run/reboot-required && cat /var/run/reboot-required
```

表示された場合。

```bash
sudo reboot
```

再起動後、PuTTYの `.ppk` Sessionで再ログイン。

```bash
uname -a
cat /etc/os-release
```

---

# 7. Security Update自動適用

```bash
sudo apt install -y unattended-upgrades
systemctl status unattended-upgrades --no-pager
```

`active`であることを確認。

設定確認。

```bash
cat /etc/apt/apt.conf.d/20auto-upgrades
```

未設定の場合。

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

**無条件自動rebootは設定しない。**

---

# 8. タイムゾーンを日本時間へ設定し、時刻同期を確認

ABLENETの初期状態は `Etc/UTC` の場合がある。サーバー運用時刻を日本時間へ統一する。

```bash
sudo timedatectl set-timezone Asia/Tokyo
timedatectl status
```

以下を確認。

```text
Time zone: Asia/Tokyo (JST, +0900)
System clock synchronized: yes
NTP service: active
RTC in local TZ: no
```

`RTC in local TZ: no` は正常。ハードウェアクロックはUTCのまま維持する。

`System clock synchronized: no` または `NTP service: inactive` ならSTOPして時刻同期を修正する。

---

# 9. AppArmor確認

```bash
sudo aa-status
```

AppArmorが有効であることを確認。

理由なく無効化しない。

---

# 10. UFWを設定 — この段階はSSHだけ

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp comment 'SSH'
```

IPv6確認。

```bash
grep '^IPV6=' /etc/default/ufw
```

期待値。

```text
IPV6=yes
```

UFW有効化。

```bash
sudo ufw enable
sudo ufw status verbose
```

この段階では原則、

```text
22/tcp
```

だけを許可する。

**まだ80/443を開けない。**

既存SSHを閉じず、新しいPuTTYから `.ppk` で再ログイン。

成功しなければSTOP。

---

# 11. Docker競合パッケージを削除

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y "$pkg" 2>/dev/null || true
done
```

---

# 12. Docker公式Repositoryを登録

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Repository追加。

```bash
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF_DOCKER
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF_DOCKER
```

更新。

```bash
sudo apt update
```

---

# 13. Docker Engine / Composeをインストール

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

確認。

```bash
sudo docker version
sudo docker compose version
sudo docker run --rm hello-world
```

すべて成功すること。

---

# 14. baisoundをdockerグループへ入れない

```bash
id baisound
```

出力のgroupsに、

```text
docker
```

が無いこと。

次は実行禁止。

```text
sudo usermod -aG docker baisound
```

Docker操作は今後すべて、

```bash
sudo docker ...
sudo docker compose ...
```

で実行する。

---

# 15. Host / Docker Port監査

```bash
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}'
sudo ss -lntup
sudo ufw status verbose
```

この段階で公開されてよいのはSSHのみ。

```text
22/tcp
```

不明な `0.0.0.0:<port>` や `[::]:<port>` があればSTOP。

---

# 16. Gitをインストール

```bash
sudo apt install -y git
git --version
```

---

# 17. 【STOP GATE】Canonical main統合確認

ここから先はBAI Development OSのTASK-017変更がGitHub `main`へ統合済みであることが条件。

Remote mainを確認。

```bash
git ls-remote https://github.com/baisound/bai-development-os.git refs/heads/main
```

**TASK-017 Remote Live Gate / ABLENET L3 8GB変更がまだmainへ統合されていない場合は、ここでSTOP。**

古いFULL GIT ZIPをVPSへ展開してRemote mainを上書きしない。

---

# 18. Canonical Repositoryを配置
## ※ STEP 17 Gate通過後だけ実行

```bash
sudo install -d -m 755 -o baisound -g baisound /opt/bai-development-os
sudo rmdir /opt/bai-development-os
sudo git clone https://github.com/baisound/bai-development-os.git /opt/bai-development-os
sudo chown -R baisound:baisound /opt/bai-development-os
```

移動。

```bash
cd /opt/bai-development-os
```

確認。

```bash
git status
git branch --show-current
git log -5 --oneline --decorate
```

期待。

```text
branch = main
worktree = clean
```

---

# 19. Canonical Knowledge Hubファイル確認

```bash
cd /opt/bai-development-os

test -f deploy/knowledge-hub/compose.yaml && echo PASS
test -f deploy/knowledge-hub/compose.rehearsal.yaml && echo PASS
test -f deploy/knowledge-hub/Caddyfile && echo PASS
test -f deploy/knowledge-hub/postgres/postgresql.tuned-8gb.conf && echo PASS
test -f deploy/knowledge-hub/scripts/prepare-compose-env.sh && echo PASS
test -f deploy/knowledge-hub/scripts/start-local-compose.sh && echo PASS
test -f deploy/knowledge-hub/scripts/run-live-rehearsal.sh && echo PASS
test -f deploy/knowledge-hub/scripts/verify-postgres-tuning.sh && echo PASS
```

全部PASSでなければSTOP。

---

# 20. Secret保存ディレクトリを作成

```bash
sudo install -d -m 700 -o root -g root /etc/bai-knowledge-hub
```

Canonical scriptでenv生成。

```bash
cd /opt/bai-development-os

sudo bash deploy/knowledge-hub/scripts/prepare-compose-env.sh \
  /etc/bai-knowledge-hub/knowledge-hub.env
```

権限確認。

```bash
sudo stat -c '%U %G %a %n' /etc/bai-knowledge-hub/knowledge-hub.env
```

期待。

```text
root root 600 /etc/bai-knowledge-hub/knowledge-hub.env
```

8GB Profileだけ安全に確認。

```bash
sudo grep '^POSTGRES_CONFIG_FILE=' /etc/bai-knowledge-hub/knowledge-hub.env
sudo grep '^POSTGRES_SHM_SIZE=' /etc/bai-knowledge-hub/knowledge-hub.env
```

期待。

```text
POSTGRES_CONFIG_FILE=./postgres/postgresql.tuned-8gb.conf
POSTGRES_SHM_SIZE=1gb
```

**POSTGRES_PASSWORDは画面表示しない。**

---

# 21. Private Knowledge Hubを起動

Public Caddyは起動しない。

```bash
cd /opt/bai-development-os

sudo env \
  BAI_KNOWLEDGE_HUB_ENV_FILE=/etc/bai-knowledge-hub/knowledge-hub.env \
  bash deploy/knowledge-hub/scripts/start-local-compose.sh
```

Health確認。

```bash
curl -fsS http://127.0.0.1:8787/healthz
curl -fsS http://127.0.0.1:8787/readyz
```

Compose確認。

```bash
sudo docker compose \
  --env-file /etc/bai-knowledge-hub/knowledge-hub.env \
  -f deploy/knowledge-hub/compose.yaml \
  -f deploy/knowledge-hub/compose.rehearsal.yaml \
  ps
```

---

# 22. Private Port監査

```bash
sudo ss -lntup
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

期待。

```text
knowledge-api 127.0.0.1:8787 のみ
postgres      host publishなし
caddy         起動していない
```

以下が見えたらSTOP。

```text
0.0.0.0:8787
[::]:8787
0.0.0.0:5432
[::]:5432
5432->5432
```

---

# 23. PostgreSQL 8GB Profile検証

```bash
cd /opt/bai-development-os

sudo env \
  BAI_KNOWLEDGE_HUB_ENV_FILE=/etc/bai-knowledge-hub/knowledge-hub.env \
  bash deploy/knowledge-hub/scripts/verify-postgres-tuning.sh
```

**PASSが出ること。**

NGならSTOP。

---

# 24. Real Docker / PostgreSQL Live Rehearsal

Evidence保存先作成。

```bash
sudo install -d -m 700 -o root -g root /var/lib/bai-knowledge-hub/evidence
```

実行。

```bash
cd /opt/bai-development-os

sudo env \
  BAI_KNOWLEDGE_HUB_REHEARSAL_EVIDENCE_OUT=/var/lib/bai-knowledge-hub/evidence/live-rehearsal.json \
  bash deploy/knowledge-hub/scripts/run-live-rehearsal.sh
```

Evidence検証。

```bash
cd /opt/bai-development-os

sudo node scripts/validate-knowledge-hub-live-rehearsal-evidence.mjs \
  /var/lib/bai-knowledge-hub/evidence/live-rehearsal.json
```

**PASSが出ること。**

---

# 25. Private Rehearsal最終監査

```bash
sudo ufw status verbose
sudo ss -lntup
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}'
id baisound
```

期待。

```text
UFW             22/tcpのみ
PostgreSQL      host publishなし
Knowledge API   127.0.0.1:8787のみ
Caddy           OFF
docker group     baisound未所属
```

ここまでで、

```text
HOST BASELINE          COMPLETE
PRIVATE REHEARSAL      COMPLETE
PUBLIC PRODUCTION      NOT YET
```

---

# 26. 【STOP GATE】TASK-017 Phase 0 / Public Production前の残作業

**このRunbook確定時点では、以下がCanonical Repositoryまたは実環境Evidenceとして未完了。VPS上で場当たり的に変更せず、上から順に閉じる。**

```text
1. TASK-017変更を最新Remote main系統へ統合し、PRを作成
2. GitHub Actions Remote Live Gateで実Docker/PostgreSQL rehearsal PASS
3. 生成されたruntime/package-lock.json Candidateをpolicy検証しCanonical accepted
4. Runtime DB Roleをbootstrap/migration管理RoleとNOSUPERUSER App Roleへ分離
5. Let's Encrypt IP Address Certificate取得・自動更新・Caddy統合
6. ABLENET VPS上でPrivate Live Rehearsal PASS
7. Caddy Public Activation後、External HTTPS/API Test PASS
8. Offsite Backup + Restore Test PASS
9. BAI VIDEO PRODUCTION TASK-036実PilotでEvidence受信・Candidate review
10. Final Security Audit / Phase 0 exit Evidence / Critic / Judge / Owner判定
```

この3項目がRepositoryで、

```text
実装
→ Test
→ GitHub Actions
→ PR
→ main Merge
```

まで完了するまでPublic Profileを起動しない。

実行禁止。

```text
sudo docker compose --profile public up -d
```

---

# 27. Public P0修正がmainへMergeされた後

Repository更新。

```bash
cd /opt/bai-development-os
git status
git pull --ff-only origin main
git status
git log -5 --oneline --decorate
```

`git status`がcleanであること。

Runtime lock確認。

```bash
test -f deploy/knowledge-hub/runtime/package-lock.json && echo PASS
```

PASSでなければSTOP。

---

# 28. Public Gate通過後に80/443を開ける

```bash
sudo ufw allow 80/tcp comment 'ACME HTTP / HTTP redirect'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw status verbose
```

期待。

```text
22/tcp
80/tcp
443/tcp
```

**443/udpは開けない。**

---

# 29. Caddy Public Profile起動
## ※ IP Certificate対応版がCanonical mainへ入った後だけ実行

```bash
cd /opt/bai-development-os

sudo docker compose \
  --env-file /etc/bai-knowledge-hub/knowledge-hub.env \
  -f deploy/knowledge-hub/compose.yaml \
  --profile public \
  up -d
```

確認。

```bash
sudo docker compose \
  --env-file /etc/bai-knowledge-hub/knowledge-hub.env \
  -f deploy/knowledge-hub/compose.yaml \
  --profile public \
  ps
```

---

# 30. Public Port監査

```bash
sudo ufw status verbose
sudo ss -lntup
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

期待。

```text
22/tcp   SSH
80/tcp   Caddy
443/tcp  Caddy
```

禁止。

```text
5432 public
8787 public
2019 public
443/udp（正式採用前）
```

1つでも見えたらSTOP。

---

# 31. 外部HTTPS確認

Windows PowerShellなどVPS外から実行。

```powershell
curl.exe -i https://58.191.43.211/healthz
curl.exe -i https://58.191.43.211/readyz
```

正常なHTTPS応答になること。

証明書エラーが出たらSTOP。

---

# 32. SSH最終監査

```bash
sudo sshd -t
```

何も表示されないこと。

```bash
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|authenticationmethods|allowusers|allowtcpforwarding|gatewayports'
```

期待。

```text
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
pubkeyauthentication yes
authenticationmethods publickey
allowusers baisound
allowtcpforwarding local
gatewayports no
```

---

# 33. Docker最終監査

```bash
id baisound
sudo docker ps --format 'table {{.Names}}\t{{.Ports}}'
sudo ss -lntup
```

確認。

```text
baisoundはdocker group未所属
PostgreSQL 5432 host publishなし
Knowledge API 8787 host public publishなし
Caddy 80/443のみpublic
Caddy Admin 2019 publicなし
```

---

# 34. Backup / Restore

**Public用DB Role分離後のCanonical Repositoryに含まれるBackup手順を使用する。**

VPS上でDB RoleやBackup commandを独自に作り変えない。

最低完成条件。

```text
Backup作成
SHA-256確認
VPS外へコピー
Restore Test
Restore成功記録
```

VPS内だけのBackupでは完成扱いにしない。

---

# 35. 最終完成判定

以下をすべて確認。

```text
[ ] Ubuntu Server 24.04 LTS
[ ] baisound
[ ] SSH Ed25519公開鍵のみ
[ ] root SSH DENY
[ ] Password SSH DENY
[ ] UFW ENABLED
[ ] Docker Official Repository
[ ] baisoundはdocker group未所属
[ ] AppArmor ENABLED

[ ] PostgreSQL tuned-8gb PASS
[ ] PostgreSQL 5432 host publishなし
[ ] Private Live Rehearsal PASS
[ ] Backup / Restore Rehearsal PASS

[ ] runtime/package-lock.json Canonical accepted
[ ] Runtime DB Role NOSUPERUSER
[ ] Let's Encrypt IP Certificate自動更新 PASS
[ ] Caddy IP Certificate統合 PASS

[ ] Caddy 80/443正常
[ ] Knowledge API 8787 public publishなし
[ ] Caddy Admin 2019 publicなし

[ ] Offsite Backupあり
[ ] Restore Test PASS
[ ] Final Port Audit PASS
```

全部YESで、

```text
BAI KNOWLEDGE HUB SERVER BUILD = COMPLETE
```

---

# 絶対に実行しないコマンド・操作

```text
sudo usermod -aG docker baisound
PostgreSQLへ ports: "5432:5432" を追加
Knowledge APIを 0.0.0.0:8787 で公開
VPS上でcompose.yamlを独自改造
VPS上でCaddyfileを独自改造
VPS上でDB Roleだけ先行変更
Runtime package-lock未確定のままPublic化
Remote Live Gate未完了のままPublic化
443/udpを先に開ける
古いFULL GIT ZIPでRemote mainを上書き
SSH鍵ログイン確認前にPassword SSHを無効化
```

---

**Document:** BAI DEVELOPMENT HUB サーバー構築 実行手順書  
**Version:** 4.1  
**Date:** 2026-08-12  
**Rule:** 読む資料ではなく、上から順に作業するためのRunbook。NGならその場でSTOPする。
