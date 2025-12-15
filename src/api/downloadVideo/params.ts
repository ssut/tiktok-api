import { generateDeviceId, randomChar } from '../../utils/helpers';

/**
 * Build parameters for TikTok v1 API feed endpoint
 */
export const buildTiktokApiParams = (awemeId: string): URLSearchParams => {
  return new URLSearchParams({
    aweme_id: awemeId,
    version_name: '1.1.9',
    version_code: '2018111632',
    build_number: '1.1.9',
    device_id: generateDeviceId(),
    iid: generateDeviceId(),
    manifest_version_code: '2018111632',
    update_version_code: '2018111632',
    openudid: randomChar('0123456789abcdef', 16),
    uuid: randomChar('1234567890', 16),
    _rticket: String(Date.now() * 1000),
    ts: String(Date.now()),
    device_brand: 'Google',
    device_type: 'Pixel 4',
    device_platform: 'android',
    resolution: '1080*1920',
    dpi: '420',
    os_version: '10',
    os_api: '29',
    carrier_region: 'US',
    sys_region: 'US',
    region: 'US',
    timezone_name: 'America/New_York',
    timezone_offset: '-14400',
    channel: 'googleplay',
    ac: 'wifi',
    mcc_mnc: '310260',
    is_my_cn: '0',
    ssmix: 'a',
    as: 'a1qwert123',
    cp: 'cbfhckdckkde1',
  });
};
