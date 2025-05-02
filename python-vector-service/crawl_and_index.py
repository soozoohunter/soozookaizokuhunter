#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
from crawler_shopee import crawl_shopee_shop
from crawler_kwax import crawl_kwax_site
from crawler_youtube import crawl_youtube_channel
from milvus_client import MilvusClient

def main():
    milvus_client = MilvusClient(host="milvus", port="19530")

    # 1) Shopee
    crawl_shopee_shop("tsengxiang", milvus_client)

    # 2) KWAX
    crawl_kwax_site(milvus_client)

    # 3) YouTube (channel or single link)
    channel_url = "https://www.youtube.com/c/YourChannelName"
    crawl_youtube_channel(channel_url, milvus_client)

if __name__ == "__main__":
    main()
